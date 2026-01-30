import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from './input'

export interface AutocompleteOption {
  id: string
  label: string
  subtitle?: string
  icon?: React.ReactNode
}

export interface AutocompleteProps extends Omit<InputProps, 'onChange' | 'onSelect'> {
  options: AutocompleteOption[]
  value: string
  onChange: (value: string) => void
  onSelect: (option: AutocompleteOption) => void
  isLoading?: boolean
  emptyMessage?: string
  loadingMessage?: string
}

export function Autocomplete({
  options,
  value,
  onChange,
  onSelect,
  isLoading = false,
  emptyMessage = 'No results found',
  loadingMessage = 'Searching...',
  className,
  ...props
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Show dropdown when there are options or loading
  const showDropdown = open && (options.length > 0 || isLoading || (value.length >= 2 && !isLoading))

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setOpen(true)
    setSelectedIndex(-1)
  }

  // Handle option selection
  const handleSelect = (option: AutocompleteOption) => {
    onSelect(option)
    setOpen(false)
    setSelectedIndex(-1)
    // Clear input after selection
    onChange('')
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleSelect(options[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        className={className}
        autoComplete="off"
        {...props}
      />

	      {showDropdown && (
	        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-background/95 backdrop-blur shadow-lg max-h-60 overflow-auto">
	          {isLoading ? (
	            <div className="p-3 text-sm text-muted-foreground text-center">
	              {loadingMessage}
	            </div>
          ) : options.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {emptyMessage}
            </div>
          ) : (
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors',
                    selectedIndex === index && 'bg-muted/50'
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {option.icon && (
                    <div className="flex-shrink-0">
                      {option.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {option.label}
                    </div>
                    {option.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                  {selectedIndex === index && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
