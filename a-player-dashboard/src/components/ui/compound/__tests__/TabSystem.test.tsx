/**
 * TabSystem Component Tests
 * Tests for the compound tab system components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabList, Tab, TabPanels, useActiveTab } from '../TabSystem';

// Test component that uses the tab context
const TabControlComponent = () => {
  const [activeTab, setActiveTab] = useActiveTab();
  
  return (
    <div>
      <div data-testid="active-tab">{activeTab}</div>
      <button 
        onClick={() => setActiveTab('tab2')} 
        data-testid="switch-tab-button"
      >
        Switch to Tab 2
      </button>
    </div>
  );
};

describe('TabSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tabs with correct structure', () => {
    render(
      <Tabs defaultTab="tab1">
        <TabList>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
          <Tab id="tab3" label="Tab 3">Content 3</Tab>
        </TabList>
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
          <Tab id="tab3" label="Tab 3">Content 3</Tab>
        </TabPanels>
      </Tabs>
    );

    // Should render tab buttons
    expect(screen.getByRole('button', { name: /tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tab 3/i })).toBeInTheDocument();

    // Should show default tab content
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Tabs defaultTab="tab1">
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    const tab2Button = screen.getByRole('button', { name: /tab 2/i });
    await user.click(tab2Button);

    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  it('applies active styles to current tab', () => {
    render(
      <Tabs defaultTab="tab1">
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    const tab1Button = screen.getByRole('button', { name: /tab 1/i });
    const tab2Button = screen.getByRole('button', { name: /tab 2/i });

    // Tab 1 should be active
    expect(tab1Button).toHaveAttribute('aria-current', 'page');
    expect(tab2Button).not.toHaveAttribute('aria-current', 'page');
  });

  it('handles tabs with counts', () => {
    render(
      <Tabs defaultTab="tab1">
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Pending" count={5}>Pending items</Tab>
          <Tab id="tab2" label="Completed" count={12}>Completed items</Tab>
        </TabPanels>
      </Tabs>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('handles disabled tabs', async () => {
    const user = userEvent.setup();
    
    render(
      <Tabs defaultTab="tab1">
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2" disabled>Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    const disabledTab = screen.getByRole('button', { name: /tab 2/i });
    
    expect(disabledTab).toBeDisabled();
    
    await user.click(disabledTab);
    
    // Should not switch to disabled tab
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('supports icons in tabs', () => {
    const icon = <span data-testid="tab-icon">📊</span>;
    
    render(
      <Tabs defaultTab="tab1">
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Analytics" icon={icon}>Analytics content</Tab>
        </TabPanels>
      </Tabs>
    );

    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
  });

  it('calls onChange callback when tab changes', async () => {
    const user = userEvent.setup();
    const onChangeMock = vi.fn();
    
    render(
      <Tabs defaultTab="tab1" onChange={onChangeMock}>
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    const tab2Button = screen.getByRole('button', { name: /tab 2/i });
    await user.click(tab2Button);

    expect(onChangeMock).toHaveBeenCalledWith('tab2');
  });

  it('provides tab context to child components', () => {
    render(
      <Tabs defaultTab="tab1">
        <TabControlComponent />
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    expect(screen.getByTestId('active-tab')).toHaveTextContent('tab1');
  });

  it('allows programmatic tab switching through context', async () => {
    const user = userEvent.setup();
    
    render(
      <Tabs defaultTab="tab1">
        <TabControlComponent />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    const switchButton = screen.getByTestId('switch-tab-button');
    await user.click(switchButton);

    await waitFor(() => {
      expect(screen.getByTestId('active-tab')).toHaveTextContent('tab2');
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('throws error when used outside Tabs provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TabControlComponent />);
    }).toThrow('useTabContext must be used within Tabs');

    consoleSpy.mockRestore();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <Tabs defaultTab="tab1">
        <TabList />
        <TabPanels>
          <Tab id="tab1" label="Tab 1">Content 1</Tab>
          <Tab id="tab2" label="Tab 2">Content 2</Tab>
        </TabPanels>
      </Tabs>
    );

    const tab1Button = screen.getByRole('button', { name: /tab 1/i });
    const tab2Button = screen.getByRole('button', { name: /tab 2/i });

    // Focus first tab
    tab1Button.focus();
    expect(tab1Button).toHaveFocus();

    // Arrow key navigation
    await user.keyboard('{ArrowRight}');
    expect(tab2Button).toHaveFocus();

    // Enter to activate
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });
});


