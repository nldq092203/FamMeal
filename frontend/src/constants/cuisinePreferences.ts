export type CuisineCountry = { id: string; label: string; emoji: string }
export type CuisineRegion = { id: string; label: string; emoji: string; countries: CuisineCountry[] }

export const CUISINE_PREFERENCE_CATALOG: { regions: CuisineRegion[] } = {
  regions: [
    {
      id: 'asia',
      label: 'Asia',
      emoji: '🌏',
      countries: [
        { id: 'japan', label: 'Japan', emoji: '🇯🇵' },
        { id: 'vietnam', label: 'Vietnam', emoji: '🇻🇳' },
        { id: 'thailand', label: 'Thailand', emoji: '🇹🇭' },
        { id: 'china', label: 'China', emoji: '🇨🇳' },
        { id: 'korea', label: 'Korea', emoji: '🇰🇷' },
        { id: 'india', label: 'India', emoji: '🇮🇳' },
        { id: 'other_asia', label: 'Other Asia', emoji: '➕' },
      ],
    },
    {
      id: 'europe',
      label: 'Europe',
      emoji: '🌍',
      countries: [
        { id: 'france', label: 'France', emoji: '🇫🇷' },
        { id: 'italy', label: 'Italy', emoji: '🇮🇹' },
        { id: 'spain', label: 'Spain', emoji: '🇪🇸' },
        { id: 'germany', label: 'Germany', emoji: '🇩🇪' },
        { id: 'portugal', label: 'Portugal', emoji: '🇵🇹' },
        { id: 'uk', label: 'United Kingdom', emoji: '🇬🇧' },
        { id: 'other_europe', label: 'Other Europe', emoji: '➕' },
      ],
    },
    {
      id: 'mediterranean',
      label: 'Mediterranean',
      emoji: '🌊',
      countries: [
        { id: 'italy_med', label: 'Italy', emoji: '🇮🇹' },
        { id: 'greece', label: 'Greece', emoji: '🇬🇷' },
        { id: 'turkey', label: 'Turkey', emoji: '🇹🇷' },
        { id: 'lebanon', label: 'Lebanon', emoji: '🇱🇧' },
        { id: 'morocco', label: 'Morocco', emoji: '🇲🇦' },
        { id: 'tunisia', label: 'Tunisia', emoji: '🇹🇳' },
        { id: 'other_mediterranean', label: 'Other Mediterranean', emoji: '➕' },
      ],
    },
    {
      id: 'american',
      label: 'American',
      emoji: '🇺🇸',
      countries: [
        { id: 'usa', label: 'United States', emoji: '🇺🇸' },
        { id: 'mexico', label: 'Mexico', emoji: '🇲🇽' },
        { id: 'canada', label: 'Canada', emoji: '🇨🇦' },
        { id: 'other_american', label: 'Other American', emoji: '➕' },
      ],
    },
    {
      id: 'latin_america',
      label: 'Latin America',
      emoji: '🌎',
      countries: [
        { id: 'brazil', label: 'Brazil', emoji: '🇧🇷' },
        { id: 'argentina', label: 'Argentina', emoji: '🇦🇷' },
        { id: 'peru', label: 'Peru', emoji: '🇵🇪' },
        { id: 'colombia', label: 'Colombia', emoji: '🇨🇴' },
        { id: 'cuba', label: 'Cuba', emoji: '🇨🇺' },
        { id: 'other_latin', label: 'Other Latin America', emoji: '➕' },
      ],
    },
    {
      id: 'africa',
      label: 'Africa',
      emoji: '🌍',
      countries: [
        { id: 'morocco_af', label: 'Morocco', emoji: '🇲🇦' },
        { id: 'ethiopia', label: 'Ethiopia', emoji: '🇪🇹' },
        { id: 'senegal', label: 'Senegal', emoji: '🇸🇳' },
        { id: 'nigeria', label: 'Nigeria', emoji: '🇳🇬' },
        { id: 'south_africa', label: 'South Africa', emoji: '🇿🇦' },
        { id: 'other_africa', label: 'Other Africa', emoji: '➕' },
      ],
    },
  ],
}

export function getCuisineRegion(regionId: string) {
  return CUISINE_PREFERENCE_CATALOG.regions.find((r) => r.id === regionId) ?? null
}

export function getCuisineCountry(countryId: string) {
  for (const region of CUISINE_PREFERENCE_CATALOG.regions) {
    const country = region.countries.find((c) => c.id === countryId)
    if (country) return { region, country }
  }
  return null
}

export function isOtherId(id: string) {
  return id.startsWith('other_')
}

export function isCustomRegionValue(v: string) {
  return v.startsWith('custom_region:')
}

export function isCustomCountryValue(v: string) {
  return v.startsWith('custom_country:')
}

export function makeCustomRegionValue(label: string) {
  return `custom_region:${label.trim()}`
}

export function makeCustomCountryValue(regionId: string, label: string) {
  return `custom_country:${regionId}:${label.trim()}`
}

export function formatCuisinePreferenceLabel(value: string): string {
  const region = getCuisineRegion(value)
  if (region) return `${region.emoji} ${region.label}`

  const foundCountry = getCuisineCountry(value)
  if (foundCountry) return `${foundCountry.country.emoji} ${foundCountry.country.label}`

  if (isCustomRegionValue(value)) {
    return `➕ ${value.replace('custom_region:', '').trim()}`
  }

  if (isCustomCountryValue(value)) {
    const parts = value.split(':')
    const label = parts.slice(2).join(':').trim()
    return `➕ ${label}`
  }

  return value
}

