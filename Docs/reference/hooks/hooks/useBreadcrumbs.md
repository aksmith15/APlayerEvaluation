# useBreadcrumbs

React hook for generating breadcrumb navigation based on current route and context.

## Purpose

`useBreadcrumbs` provides a utility function for generating breadcrumb navigation items based on the current application route and context. It creates consistent navigation breadcrumbs that help users understand their location within the application hierarchy.

## Signature

```typescript
function useBreadcrumbs(): {
  generateBreadcrumbs: (currentPath: string, employeeName?: string) => BreadcrumbItem[]
}
```

## Parameters

This hook takes no parameters.

## Returns

| Name | Type | Description |
|------|------|-------------|
| `generateBreadcrumbs` | `(currentPath: string, employeeName?: string) => BreadcrumbItem[]` | Function that generates breadcrumb items for a given path |

### BreadcrumbItem Structure
```typescript
interface BreadcrumbItem {
  label: string;      // Display text for the breadcrumb
  href?: string;      // Optional navigation link
  current?: boolean;  // Whether this is the current page
}
```

## Usage Example

```typescript
// In a page component
const { generateBreadcrumbs } = useBreadcrumbs();
const location = useLocation();

// Generate breadcrumbs for current route
const breadcrumbs = generateBreadcrumbs(
  location.pathname,
  employee?.name // Optional context
);

// Render breadcrumb navigation
return (
  <div>
    <Breadcrumb items={breadcrumbs} />
    <main>
      <PageContent />
    </main>
  </div>
);

// Example breadcrumb generation results:
// Path: "/employees" 
// Result: [{ label: "Employee Selection", current: true }]

// Path: "/analytics?employeeId=123" with employeeName="John Doe"
// Result: [
//   { label: "Employee Selection", href: "/employees" },
//   { label: "John Doe Analytics", current: true }
// ]
```

## Side Effects

### None
This hook has no side effects - it's a pure utility function that generates breadcrumb data based on inputs.

## Dependencies

### None
- No external dependencies
- Pure JavaScript logic for path parsing
- No React hooks or state management

## Error Handling & Retries

### Graceful Fallback
```typescript
const generateBreadcrumbs = (currentPath: string, employeeName?: string): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always include dashboard/home as fallback
  breadcrumbs.push({
    label: 'Employee Selection',
    href: '/employees'
  });

  // Add specific breadcrumb based on current path
  if (currentPath.includes('/analytics')) {
    breadcrumbs.push({
      label: employeeName ? `${employeeName} Analytics` : 'Employee Analytics',
      current: true
    });
  }

  return breadcrumbs;
};
```

### Safe Path Handling
- **Invalid Paths**: Returns default breadcrumb for unknown paths
- **Missing Context**: Provides generic labels when employee name is unavailable
- **Empty Arrays**: Always returns at least one breadcrumb item

## Performance Notes

### Zero Overhead
- **No State**: Hook doesn't maintain any internal state
- **No Effects**: No useEffect or subscription overhead
- **Pure Function**: Simple path-to-breadcrumb mapping

### Efficient Generation
- **Fast Lookup**: Uses simple string matching for path detection
- **Minimal Allocation**: Creates only necessary breadcrumb objects
- **No Memoization Needed**: Function is lightweight enough to run on every render

## Current Implementation

### Supported Routes
```typescript
// Currently implemented breadcrumb patterns:
'/employees' → ['Employee Selection']
'/analytics' → ['Employee Selection', '{Name} Analytics' | 'Employee Analytics']
```

### Default Behavior
- **Home Base**: Always starts with "Employee Selection" as the root
- **Current Page**: Last breadcrumb is marked with `current: true`
- **Navigation Links**: Previous breadcrumbs include `href` for navigation

## Breadcrumb Component Integration

### Breadcrumb Component Usage
```typescript
// The Breadcrumb component that renders the breadcrumb items
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {/* Separator for non-first items */}
            {index > 0 && <ChevronRightIcon />}
            
            {/* Breadcrumb item */}
            {item.current ? (
              <span className="text-sm font-medium text-secondary-700" aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <button
                onClick={() => handleNavigation(item.href!)}
                className="text-sm font-medium text-secondary-500 hover:text-secondary-700 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-sm font-medium text-secondary-500">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
```

## Extension Patterns

### Adding New Routes
```typescript
// Pattern for extending breadcrumb generation
const generateBreadcrumbs = (currentPath: string, employeeName?: string): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always include dashboard/home
  breadcrumbs.push({
    label: 'Employee Selection',
    href: '/employees'
  });

  // Add route-specific breadcrumbs
  if (currentPath.includes('/analytics')) {
    breadcrumbs.push({
      label: employeeName ? `${employeeName} Analytics` : 'Employee Analytics',
      current: true
    });
  } else if (currentPath.includes('/assignments/manage')) {
    breadcrumbs.push({
      label: 'Assignment Management',
      current: true
    });
  } else if (currentPath.includes('/assignments/my')) {
    breadcrumbs.push({
      label: 'My Assignments',
      current: true
    });
  }
  // Add more routes as needed...

  return breadcrumbs;
};
```

### Context-Aware Breadcrumbs
```typescript
// Enhanced version with more context parameters
const generateBreadcrumbs = (
  currentPath: string, 
  context?: {
    employeeName?: string;
    quarterName?: string;
    assignmentName?: string;
  }
): BreadcrumbItem[] => {
  // Implementation with rich context support
};
```

---

**📁 File Location:** `a-player-dashboard/src/components/ui/Breadcrumb.tsx` (lines 61-82)  
**🔗 Related:** [Breadcrumb Component](../components/Breadcrumb.md), [Navigation Context](../contexts/NavigationContext.md)


