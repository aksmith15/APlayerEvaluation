// SearchInput component unit tests
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'

describe('SearchInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input with default placeholder', () => {
    render(<SearchInput {...defaultProps} />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Search...')
  })

  it('renders with custom placeholder', () => {
    render(<SearchInput {...defaultProps} placeholder="Search employees..." />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('placeholder', 'Search employees...')
  })

  it('displays the current value', () => {
    render(<SearchInput {...defaultProps} value="test search" />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('test search')
  })

  it('calls onChange when user types', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    render(<SearchInput value="" onChange={handleChange} />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'test')
    
    expect(handleChange).toHaveBeenCalledTimes(4) // One call per character
    expect(handleChange).toHaveBeenNthCalledWith(1, 't')
    expect(handleChange).toHaveBeenNthCalledWith(2, 'e')
    expect(handleChange).toHaveBeenNthCalledWith(3, 's')
    expect(handleChange).toHaveBeenNthCalledWith(4, 't')
  })

  it('renders label when provided', () => {
    render(<SearchInput {...defaultProps} label="Employee Search" />)
    
    expect(screen.getByText('Employee Search')).toBeInTheDocument()
    expect(screen.getByLabelText('Employee Search')).toBeInTheDocument()
  })

  it('shows required indicator when required is true', () => {
    render(<SearchInput {...defaultProps} label="Search" required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByText('*')).toHaveAttribute('aria-label', 'required')
  })

  it('applies custom id correctly', () => {
    render(<SearchInput {...defaultProps} id="custom-search" label="Search" />)
    
    const input = screen.getByRole('searchbox')
    const label = screen.getByText('Search')
    
    expect(input).toHaveAttribute('id', 'custom-search')
    expect(label).toHaveAttribute('for', 'custom-search')
  })

  it('applies default id when not provided', () => {
    render(<SearchInput {...defaultProps} label="Search" />)
    
    const input = screen.getByRole('searchbox')
    const label = screen.getByText('Search')
    
    expect(input).toHaveAttribute('id', 'search')
    expect(label).toHaveAttribute('for', 'search')
  })

  it('applies custom className to container', () => {
    render(<SearchInput {...defaultProps} className="custom-container" />)
    
    const container = screen.getByRole('searchbox').parentElement?.parentElement
    expect(container).toHaveClass('custom-container')
  })

  it('has proper accessibility attributes', () => {
    render(
      <SearchInput 
        {...defaultProps} 
        ariaDescribedBy="search-help"
        required
        label="Employee Search"
      />
    )
    
    const input = screen.getByRole('searchbox')
    
    expect(input).toHaveAttribute('role', 'searchbox')
    expect(input).toHaveAttribute('aria-describedby', 'search-help')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAttribute('aria-label', 'Employee Search')
  })

  it('uses fallback aria-label when no label provided', () => {
    render(<SearchInput {...defaultProps} />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('aria-label', 'Search')
  })

  it('has autocomplete attribute set correctly', () => {
    render(<SearchInput {...defaultProps} autoComplete="name" />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('autocomplete', 'name')
  })

  it('defaults to autocomplete="off"', () => {
    render(<SearchInput {...defaultProps} />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveAttribute('autocomplete', 'off')
  })

  it('renders search icon', () => {
    render(<SearchInput {...defaultProps} />)
    
    const icon = screen.getByRole('searchbox').parentElement?.querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('h-5', 'w-5', 'text-secondary-400')
  })

  it('shows live region when value is present', () => {
    render(<SearchInput {...defaultProps} value="test" />)
    
    const liveRegion = screen.getByText('Search results will update automatically as you type')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    expect(liveRegion).toHaveClass('sr-only')
  })

  it('hides live region when value is empty', () => {
    render(<SearchInput {...defaultProps} value="" />)
    
    expect(screen.queryByText('Search results will update automatically as you type')).not.toBeInTheDocument()
  })

  it('handles clear and re-type scenario', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    const { rerender } = render(<SearchInput value="initial" onChange={handleChange} />)
    
    // Clear the input
    rerender(<SearchInput value="" onChange={handleChange} />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('')
    
    // Type new value
    await user.type(input, 'new search')
    expect(handleChange).toHaveBeenCalledTimes(10) // 'new search' has 10 characters including space
    // Verify individual character calls match expected pattern
    expect(handleChange).toHaveBeenNthCalledWith(1, 'n')
    expect(handleChange).toHaveBeenNthCalledWith(4, ' ') // space character
    expect(handleChange).toHaveBeenNthCalledWith(10, 'h') // last character
  })

  it('focuses input when label is clicked', async () => {
    const user = userEvent.setup()
    
    render(<SearchInput {...defaultProps} label="Search Label" />)
    
    const label = screen.getByText('Search Label')
    const input = screen.getByRole('searchbox')
    
    await user.click(label)
    expect(input).toHaveFocus()
  })
}) 