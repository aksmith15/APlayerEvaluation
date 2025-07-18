import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
  });

  test('Complete User Journey: Login → Employee Selection → Analytics', async ({ page }) => {
    // Step 1: User Authentication
    await test.step('User logs in successfully', async () => {
      // Wait for login form to be visible
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Fill in credentials (using test credentials)
      await page.fill('[data-testid="email-input"]', 'manager@company.com');
      await page.fill('[data-testid="password-input"]', 'testPassword123');
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      
      // Verify successful login redirect
      await expect(page).toHaveURL(/\/employees/);
      await expect(page.locator('[data-testid="employee-selection-page"]')).toBeVisible();
    });

    // Step 2: Employee Selection
    await test.step('User selects an employee from the list', async () => {
      // Wait for employee list to load
      await expect(page.locator('[data-testid="employee-list"]')).toBeVisible();
      
      // Verify employees are displayed
      const employeeCards = page.locator('[data-testid="employee-card"]');
      const cardCount = await employeeCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Search for a specific employee
      await page.fill('[data-testid="search-input"]', 'John Smith');
      await expect(employeeCards).toHaveCount(1);
      
      // Click on the employee
      await employeeCards.first().click();
      
      // Verify navigation to analytics page
      await expect(page).toHaveURL(/\/analytics\/\w+/);
    });

    // Step 3: Analytics Page Functionality
    await test.step('User views and interacts with analytics', async () => {
      // Wait for analytics page to load
      await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
      
      // Verify employee header information
      await expect(page.locator('[data-testid="employee-name"]')).toContainText('John Smith');
      await expect(page.locator('[data-testid="employee-role"]')).toBeVisible();
      
      // Verify charts are rendered
      await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      
      // Test quarter filtering
      await page.click('[data-testid="quarter-selector"]');
      await page.click('[data-testid="quarter-option-Q3-2023"]');
      
      // Verify charts update with new data
      await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible();
      
      // Test AI analysis generation
      const generateButton = page.locator('[data-testid="generate-analysis-button"]');
      if (await generateButton.isVisible()) {
        await generateButton.click();
        await expect(page.locator('[data-testid="analysis-status"]')).toContainText(/generating|processing/i);
      }
    });
  });

  test('Employee Search and Filter Functionality', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'manager@company.com');
    await page.fill('[data-testid="password-input"]', 'testPassword123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL(/\/employees/);

    await test.step('Search functionality works correctly', async () => {
      const searchInput = page.locator('[data-testid="search-input"]');
      const employeeCards = page.locator('[data-testid="employee-card"]');
      
      // Test search with results
      await searchInput.fill('John');
      const searchResultCount = await employeeCards.count();
      expect(searchResultCount).toBeGreaterThan(0);
      await expect(employeeCards.first()).toContainText('John');
      
      // Test search with no results
      await searchInput.fill('NonexistentEmployee123');
      await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
      
      // Clear search
      await searchInput.clear();
      const clearedSearchCount = await employeeCards.count();
      expect(clearedSearchCount).toBeGreaterThan(0);
    });

    await test.step('Department filtering works correctly', async () => {
      // Test department filter if available
      const departmentFilter = page.locator('[data-testid="department-filter"]');
      if (await departmentFilter.isVisible()) {
        await departmentFilter.selectOption('Engineering');
        const employeeCards = page.locator('[data-testid="employee-card"]');
        const filteredCount = await employeeCards.count();
        expect(filteredCount).toBeGreaterThan(0);
        
        // Verify all visible employees are from Engineering
        for (let i = 0; i < await employeeCards.count(); i++) {
          await expect(employeeCards.nth(i).locator('[data-testid="employee-department"]'))
            .toContainText('Engineering');
        }
      }
    });
  });

  test('Authentication Edge Cases', async ({ page }) => {
    await test.step('Invalid credentials show error message', async () => {
      await page.fill('[data-testid="email-input"]', 'invalid@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid|incorrect|failed/i);
      
      // Should stay on login page
      await expect(page).toHaveURL(/\/login|\/$/);
    });

    await test.step('Empty form validation works', async () => {
      await page.click('[data-testid="login-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });
  });

  test('Responsive Design and Mobile Compatibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await test.step('Login page is mobile responsive', async () => {
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Form should be usable on mobile
      await page.fill('[data-testid="email-input"]', 'manager@company.com');
      await page.fill('[data-testid="password-input"]', 'testPassword123');
      await page.click('[data-testid="login-button"]');
      
      await expect(page).toHaveURL(/\/employees/);
    });

    await test.step('Employee list is mobile responsive', async () => {
      const employeeList = page.locator('[data-testid="employee-list"]');
      await expect(employeeList).toBeVisible();
      
      // Cards should be stacked vertically on mobile
      const employeeCards = page.locator('[data-testid="employee-card"]');
      await expect(employeeCards.first()).toBeVisible();
    });

    await test.step('Analytics page is mobile responsive', async () => {
      // Navigate to analytics by clicking first employee
      await page.locator('[data-testid="employee-card"]').first().click();
      await expect(page).toHaveURL(/\/analytics\/\w+/);
      
      // Charts should be visible and responsive
      await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();
      
      // Mobile navigation should work
      const quarterSelector = page.locator('[data-testid="quarter-selector"]');
      if (await quarterSelector.isVisible()) {
        await quarterSelector.click();
      }
    });
  });

  test('Performance and Loading States', async ({ page }) => {
    // Test loading states and performance
    await test.step('Loading states are properly displayed', async () => {
      // Navigate to login
      await page.goto('/');
      
      // Login with proper credentials
      await page.fill('[data-testid="email-input"]', 'manager@company.com');
      await page.fill('[data-testid="password-input"]', 'testPassword123');
      
      // Intercept API calls to test loading states
      await page.route('**/api/employees*', route => {
        // Delay response to see loading state
        setTimeout(() => route.continue(), 1000);
      });
      
      await page.click('[data-testid="login-button"]');
      
      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Eventually load the content
      await expect(page.locator('[data-testid="employee-list"]')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Page loads within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.fill('[data-testid="email-input"]', 'manager@company.com');
      await page.fill('[data-testid="password-input"]', 'testPassword123');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="employee-list"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
  });
  
  test('Data Visualization Interactions', async ({ page }) => {
    // Login and navigate to analytics
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'manager@company.com');
    await page.fill('[data-testid="password-input"]', 'testPassword123');
    await page.click('[data-testid="login-button"]');
    await page.locator('[data-testid="employee-card"]').first().click();
    
    await test.step('Charts display data correctly', async () => {
      // Wait for charts to load
      await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      
      // Verify chart containers have content
      const radarChart = page.locator('[data-testid="radar-chart"]');
      const chartElements = radarChart.locator('svg, canvas, .recharts-wrapper');
      await expect(chartElements.first()).toBeVisible();
    });

    await test.step('Quarter filtering updates all charts', async () => {
      const quarterSelector = page.locator('[data-testid="quarter-selector"]');
      await quarterSelector.click();
      
      // Select different quarter
      await page.click('[data-testid="quarter-option-Q2-2023"]');
      
      // Charts should still be visible (data may change)
      await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
    });

    await test.step('Download functionality works', async () => {
      const downloadButton = page.locator('[data-testid="download-analytics-button"]');
      if (await downloadButton.isVisible()) {
        // Set up download handling
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadButton.click()
        ]);
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/analytics|report/i);
      }
    });
  });
}); 