import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiChevronDown, FiLoader, FiX } from 'react-icons/fi'

interface AsyncComboboxProps<T> {
  value: string
  selectedLabel?: string
  placeholder: string
  queryKey: string
  loadOptions: (query: string) => Promise<T[]>
  getOptionValue: (option: T) => string
  getOptionLabel: (option: T) => string
  onChange: (value: string, option?: T) => void
  disabled?: boolean
  required?: boolean
  allowClear?: boolean
  emptyMessage?: string
}

export function AsyncCombobox<T>({
  value,
  selectedLabel,
  placeholder,
  queryKey,
  loadOptions,
  getOptionValue,
  getOptionLabel,
  onChange,
  disabled = false,
  required = false,
  allowClear = true,
  emptyMessage = 'No matches found',
}: AsyncComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const optionsQuery = useQuery({
    queryKey: ['async-combobox', queryKey, debouncedSearch],
    queryFn: () => loadOptions(debouncedSearch),
    enabled: open && !disabled,
    staleTime: 30_000,
  })

  const displayValue = value ? selectedLabel || selectedText : search

  return (
    <div className="relative">
      <input
        type="hidden"
        value={value}
        required={required}
        aria-hidden="true"
      />
      <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        <input
          className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2.5 text-slate-900 outline-none"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => {
            setOpen(true)
            if (value) setSearch('')
          }}
          onChange={(event) => {
            setSearch(event.target.value)
            if (value) {
              setSelectedText('')
              onChange('')
            }
            setOpen(true)
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {allowClear && value ? <button className="p-2 text-slate-400 hover:text-slate-700" type="button" aria-label="Clear selection" onMouseDown={(event) => event.preventDefault()}         onClick={() => { setSearch(''); setSelectedText(''); onChange('') }}><FiX aria-hidden="true" /></button> : <FiChevronDown className="mr-3 text-slate-400" aria-hidden="true" />}
      </div>
      {open ? <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl" role="listbox">
        {optionsQuery.isLoading ? <p className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500"><FiLoader className="animate-spin" aria-hidden="true" />Searching...</p> : null}
        {optionsQuery.isError ? <p className="px-3 py-2 text-sm text-rose-600">Unable to load matches.</p> : null}
        {!optionsQuery.isLoading && !optionsQuery.isError && !optionsQuery.data?.length ? <p className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</p> : null}
        {optionsQuery.data?.map((option) => <button className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700" type="button" role="option" key={getOptionValue(option)} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(getOptionValue(option), option); setSelectedText(getOptionLabel(option)); setSearch(''); setOpen(false) }}>{getOptionLabel(option)}</button>)}
      </div> : null}
    </div>
  )
}
