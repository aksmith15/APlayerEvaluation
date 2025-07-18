// Card component unit tests
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'

describe('Card Component', () => {
  it('renders card with children content', () => {
    render(
      <Card>
        <h2>Test Title</h2>
        <p>Test content</p>
      </Card>
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies base classes correctly', () => {
    const { container } = render(<Card>Base classes test</Card>)
    const card = container.firstElementChild
    
    expect(card).toHaveClass(
      'card',
      'bg-white',
      'rounded-lg',
      'shadow-sm',
      'border',
      'border-secondary-200',
      'p-6',
      'transition-all',
      'duration-200'
    )
  })

  it('applies custom className correctly', () => {
    const { container } = render(<Card className="custom-class">Custom class test</Card>)
    const card = container.firstElementChild
    
    expect(card).toHaveClass('custom-class')
  })

  it('applies hoverable styles when hoverable is true', () => {
    const { container } = render(<Card hoverable>Hoverable test</Card>)
    const card = container.firstElementChild
    
    expect(card).toHaveClass(
      'hover:shadow-md',
      'hover:border-secondary-300',
      'cursor-pointer',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'focus:ring-offset-2'
    )
  })

  it('handles click events correctly', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(<Card onClick={handleClick}>Clickable card</Card>)
    const card = container.firstElementChild
    
    await user.click(card!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('becomes interactive when onClick is provided', () => {
    const handleClick = vi.fn()
    
    const { container } = render(<Card onClick={handleClick}>Interactive card</Card>)
    const card = container.firstElementChild
    
    expect(card).toHaveAttribute('role', 'button')
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('supports keyboard navigation with Enter key', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(<Card onClick={handleClick}>Keyboard test</Card>)
    const card = container.firstElementChild! as HTMLElement
    
    card.focus()
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('supports keyboard navigation with Space key', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(<Card onClick={handleClick}>Space key test</Card>)
    const card = container.firstElementChild! as HTMLElement
    
    card.focus()
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not handle keyboard events when not interactive', async () => {
    const user = userEvent.setup()
    
    const { container } = render(<Card>Non-interactive card</Card>)
    const card = container.firstElementChild! as HTMLElement
    
    // Should not throw error or have focus behavior
    await user.keyboard('{Enter}')
    await user.keyboard('{Space}')
    
    expect(card).not.toHaveAttribute('role')
    expect(card).not.toHaveAttribute('tabIndex')
  })

  it('applies accessibility attributes correctly', () => {
    const { container } = render(
      <Card 
        ariaLabel="Custom card label"
        ariaDescribedBy="card-description"
        role="article"
      >
        Accessibility test
      </Card>
    )
    const card = container.firstElementChild
    
    expect(card).toHaveAttribute('aria-label', 'Custom card label')
    expect(card).toHaveAttribute('aria-describedby', 'card-description')
    expect(card).toHaveAttribute('role', 'article')
  })

  it('overrides tabIndex when explicitly provided', () => {
    const { container } = render(<Card tabIndex={-1}>Custom tabIndex</Card>)
    const card = container.firstElementChild
    
    expect(card).toHaveAttribute('tabIndex', '-1')
  })

  it('does not apply interactive styles when not hoverable and no onClick', () => {
    const { container } = render(<Card>Static card</Card>)
    const card = container.firstElementChild
    
    expect(card).not.toHaveClass('hover:shadow-md')
    expect(card).not.toHaveClass('cursor-pointer')
    expect(card).not.toHaveAttribute('role')
  })

  it('combines hoverable and onClick functionality', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(<Card hoverable onClick={handleClick}>Combined test</Card>)
    const card = container.firstElementChild! as HTMLElement
    
    expect(card).toHaveClass('hover:shadow-md', 'cursor-pointer')
    expect(card).toHaveAttribute('role', 'button')
    
    await user.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
}) 