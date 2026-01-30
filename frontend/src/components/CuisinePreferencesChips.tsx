import { useMemo, useState } from 'react'
import { Globe, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CUISINE_PREFERENCE_CATALOG,
  formatCuisinePreferenceLabel,
  getCuisineRegion,
  isOtherId,
  isCustomCountryValue,
  isCustomRegionValue,
  makeCustomCountryValue,
  makeCustomRegionValue,
} from '@/constants/cuisinePreferences'

interface CuisinePreferencesChipsProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

function toggleValue(selected: string[], value: string) {
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function isRegionId(id: string) {
  return Boolean(getCuisineRegion(id))
}

function getSelectedRegions(selected: string[]) {
  const regions = new Set<string>()

  for (const v of selected) {
    if (isRegionId(v)) regions.add(v)
    if (isCustomRegionValue(v)) regions.add(v)
    if (isCustomCountryValue(v)) {
      const parts = v.split(':')
      const regionId = parts[1]
      if (regionId) regions.add(regionId)
    }
  }

  // If any country in a region is selected, include that region in the UI.
  for (const region of CUISINE_PREFERENCE_CATALOG.regions) {
    if (selected.some((v) => region.countries.some((c) => c.id === v))) regions.add(region.id)
  }

  return Array.from(regions)
}

function getSelectedCountriesForRegion(selected: string[], regionId: string) {
  const region = getCuisineRegion(regionId)
  if (!region) {
    // For custom regions, only custom countries can exist.
    return selected.filter((v) => isCustomCountryValue(v) && v.startsWith(`custom_country:${regionId}:`))
  }
  const countryIds = region.countries.map((c) => c.id)
  const builtIn = selected.filter((v) => countryIds.includes(v))
  const custom = selected.filter((v) => isCustomCountryValue(v) && v.startsWith(`custom_country:${regionId}:`))
  return [...builtIn, ...custom]
}

function toPayload(selected: string[], selectedRegions: string[]) {
  // Rule: if region selected but no country, store the region id (means "any country in region").
  // If countries selected within a region, store only those country values (optional region is implied).
  const next: string[] = []

  for (const regionId of selectedRegions) {
    const countries = getSelectedCountriesForRegion(selected, regionId)
    if (countries.length === 0) next.push(regionId)
    else next.push(...countries)
  }

  // Keep any stray custom region values that are selected but not in selectedRegions list.
  const customs = selected.filter((v) => isCustomRegionValue(v))
  return unique([...next, ...customs])
}

export function CuisinePreferencesChips({ selected, onChange }: CuisinePreferencesChipsProps) {
  const selectedRegions = useMemo(() => getSelectedRegions(selected), [selected])
  const [showCustomRegion, setShowCustomRegion] = useState(false)
  const [customRegionInput, setCustomRegionInput] = useState('')
  const [customCountryRegion, setCustomCountryRegion] = useState<string | null>(null)
  const [customCountryInput, setCustomCountryInput] = useState('')

  const regionHasAnySelection = selectedRegions.length > 0

  const toggleRegion = (regionId: string) => {
    const isSelected = selectedRegions.includes(regionId)
    const nextRegions = isSelected ? selectedRegions.filter((r) => r !== regionId) : [...selectedRegions, regionId]

    // When region removed, also clear its countries from selection.
    let nextSelected = selected.slice()
    if (isSelected) {
      const region = getCuisineRegion(regionId)
      if (region) {
        nextSelected = nextSelected.filter((v) => !region.countries.some((c) => c.id === v))
      }
      nextSelected = nextSelected.filter((v) => !(isCustomCountryValue(v) && v.startsWith(`custom_country:${regionId}:`)))
      nextSelected = nextSelected.filter((v) => v !== regionId)
    } else {
      // Ensure region id exists in selected so it can be persisted if no countries chosen.
      nextSelected = unique([...nextSelected, regionId])
    }

    onChange(toPayload(nextSelected, nextRegions))
  }

  const toggleCountry = (regionId: string, countryId: string) => {
    const next = toggleValue(selected.filter((v) => v !== regionId), countryId)
    onChange(toPayload(next, selectedRegions.includes(regionId) ? selectedRegions : [...selectedRegions, regionId]))
  }

  const addCustomRegion = () => {
    const trimmed = customRegionInput.trim()
    if (!trimmed) return
    const value = makeCustomRegionValue(trimmed)
    const nextSelected = unique([...selected, value])
    onChange(toPayload(nextSelected, [...selectedRegions, value]))
    setCustomRegionInput('')
    setShowCustomRegion(false)
  }

  const addCustomCountry = () => {
    const regionId = customCountryRegion
    const trimmed = customCountryInput.trim()
    if (!regionId || !trimmed) return
    const value = makeCustomCountryValue(regionId, trimmed)
    const nextSelected = unique([...selected.filter((v) => v !== regionId), value])
    onChange(toPayload(nextSelected, selectedRegions.includes(regionId) ? selectedRegions : [...selectedRegions, regionId]))
    setCustomCountryInput('')
    setCustomCountryRegion(null)
  }

  const chipClass = (active: boolean) =>
    cn(
      'px-4 py-2 rounded-full text-sm transition-all border',
      active
        ? 'bg-primary text-primary-foreground font-medium border-primary'
        : 'bg-background text-muted-foreground hover:bg-muted/50 border-border'
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Globe className="h-4 w-4" />
        <span>🌍 Choose cuisine region(s)</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CUISINE_PREFERENCE_CATALOG.regions.map((region) => {
          const isSelected = selectedRegions.includes(region.id)
          return (
            <button key={region.id} type="button" onClick={() => toggleRegion(region.id)} className={chipClass(isSelected)}>
              <span className="mr-1.5">{region.emoji}</span>
              {region.label}
            </button>
          )
        })}

        {/* Region-level Other */}
        {!showCustomRegion ? (
          <button
            type="button"
            onClick={() => setShowCustomRegion(true)}
            className={cn(chipClass(false), 'border-dashed')}
          >
            <Plus className="h-3.5 w-3.5 inline mr-1.5" />
            Other
          </button>
        ) : null}

        {/* Show existing custom region chips */}
        {selected
          .filter((v) => isCustomRegionValue(v))
          .map((v) => (
            <button key={v} type="button" onClick={() => toggleRegion(v)} className={chipClass(selectedRegions.includes(v))}>
              {formatCuisinePreferenceLabel(v)}
            </button>
          ))}
      </div>

      {showCustomRegion ? (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={customRegionInput}
            onChange={(e) => setCustomRegionInput(e.target.value)}
            placeholder="Enter region…"
            className="flex-1 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomRegion()
              } else if (e.key === 'Escape') {
                setShowCustomRegion(false)
                setCustomRegionInput('')
              }
            }}
          />
          <Button type="button" size="sm" onClick={addCustomRegion} disabled={!customRegionInput.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowCustomRegion(false)
              setCustomRegionInput('')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {regionHasAnySelection ? (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-foreground">🌎 Choose country (optional)</div>
          <p className="text-xs text-muted-foreground">
            If you select regions but no countries, we’ll assume any country in those regions.
          </p>

          <div className="space-y-5">
            {selectedRegions
              .filter((r) => !isCustomRegionValue(r) && isRegionId(r))
              .map((regionId) => {
                const region = getCuisineRegion(regionId)!
                const selectedCountries = getSelectedCountriesForRegion(selected, regionId)
                return (
                  <div key={regionId} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{region.emoji}</span>
                      <span>{region.label}</span>
                      {selectedCountries.length > 0 ? (
                        <span className="text-xs text-muted-foreground">({selectedCountries.length} selected)</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">(any)</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {region.countries.map((country) => {
                        const isOther = isOtherId(country.id)
                        if (isOther) {
                          return (
                            <button
                              key={country.id}
                              type="button"
                              onClick={() => {
                                setCustomCountryRegion(regionId)
                                setCustomCountryInput('')
                              }}
                              className={cn(chipClass(false), 'border-dashed')}
                            >
                              <span className="mr-1.5">{country.emoji}</span>
                              {country.label}
                            </button>
                          )
                        }

                        const active = selected.includes(country.id)
                        return (
                          <button
                            key={country.id}
                            type="button"
                            onClick={() => toggleCountry(regionId, country.id)}
                            className={chipClass(active)}
                          >
                            <span className="mr-1.5">{country.emoji}</span>
                            {country.label}
                          </button>
                        )
                      })}

                      {selected
                        .filter((v) => isCustomCountryValue(v) && v.startsWith(`custom_country:${regionId}:`))
                        .map((v) => (
                          <button key={v} type="button" onClick={() => toggleCountry(regionId, v)} className={chipClass(true)}>
                            {formatCuisinePreferenceLabel(v)}
                          </button>
                        ))}
                    </div>
                  </div>
                )
              })}

            {/* Custom regions: show only free-form countries */}
            {selectedRegions
              .filter((r) => isCustomRegionValue(r))
              .map((customRegionValue) => {
                const selectedCountries = getSelectedCountriesForRegion(selected, customRegionValue)
                const label = formatCuisinePreferenceLabel(customRegionValue)
                return (
                  <div key={customRegionValue} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{label}</span>
                      {selectedCountries.length > 0 ? (
                        <span className="text-xs text-muted-foreground">({selectedCountries.length} selected)</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">(any)</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCountryRegion(customRegionValue)
                          setCustomCountryInput('')
                        }}
                        className={cn(chipClass(false), 'border-dashed')}
                      >
                        <Plus className="h-3.5 w-3.5 inline mr-1.5" />
                        Add country
                      </button>

                      {selected
                        .filter((v) => isCustomCountryValue(v) && v.startsWith(`custom_country:${customRegionValue}:`))
                        .map((v) => (
                          <button key={v} type="button" onClick={() => toggleCountry(customRegionValue, v)} className={chipClass(true)}>
                            {formatCuisinePreferenceLabel(v)}
                          </button>
                        ))}
                    </div>
                  </div>
                )
              })}
          </div>

          {customCountryRegion ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={customCountryInput}
                onChange={(e) => setCustomCountryInput(e.target.value)}
                placeholder="Enter country…"
                className="flex-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomCountry()
                  } else if (e.key === 'Escape') {
                    setCustomCountryRegion(null)
                    setCustomCountryInput('')
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addCustomCountry} disabled={!customCountryInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCustomCountryRegion(null)
                  setCustomCountryInput('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

