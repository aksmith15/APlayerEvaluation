import { Page, expect } from '@playwright/test';

// Test data constants
export const TEST_USERS = {
  MANAGER: {
    email: 'manager@company.com',
    password: 'testPassword123',
    role: 'Manager',
    name: 'Test Manager'
  },
  EMPLOYEE: {
    email: 'employee@company.com',
    password: 'testPassword123',
    role: 'Employee',
    name: 'Test Employee'
  }
};

export const MOCK_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Senior Developer',
    department: 'Engineering',
    active: true,
    hire_date: '2023-01-15',
    created_at: '2023-01-15T10:00:00Z',
    latestQuarter: 'Q4 2023'
  },
  {
    id: 'emp-2',
    name: 'Jane Doe',
    email: 'jane.doe@company.com',
    role: 'Product Manager',
    department: 'Product',
    active: true,
    hire_date: '2022-03-10',
    created_at: '2022-03-10T10:00:00Z',
    latestQuarter: 'Q4 2023'
  },
  {
    id: 'emp-3',
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    role: 'UX Designer',
    department: 'Design',
    active: true,
    hire_date: '2023-06-01',
    created_at: '2023-06-01T10:00:00Z',
    latestQuarter: 'Q4 2023'
  }
];

export const MOCK_EVALUATION_SCORES = [
  {
    id: '1',
    person_id: 'emp-1',
    quarter_id: 'Q4_2023',
    attribute: 'Communication',
    manager_score: 8.5,
    peer_score: 8.0,
    self_score: 7.5,
    weighted_score: 8.2,
    created_at: '2023-12-01T10:00:00Z'
  },
  {
    id: '2',
    person_id: 'emp-1',
    quarter_id: 'Q4_2023',
    attribute: 'Technical Skills',
    manager_score: 9.0,
    peer_score: 8.5,
    self_score: 8.0,
    weighted_score: 8.7,
    created_at: '2023-12-01T10:00:00Z'
  },
  {
    id: '3',
    person_id: 'emp-1',
    quarter_id: 'Q4_2023',
    attribute: 'Leadership',
    manager_score: 7.5,
    peer_score: 7.0,
    self_score: 7.8,
    weighted_score: 7.4,
    created_at: '2023-12-01T10:00:00Z'
  }
];

export const MOCK_QUARTERS = [
  { id: 'Q4_2023', name: 'Q4 2023', startDate: '2023-10-01', endDate: '2023-12-31' },
  { id: 'Q3_2023', name: 'Q3 2023', startDate: '2023-07-01', endDate: '2023-09-30' },
  { id: 'Q2_2023', name: 'Q2 2023', startDate: '2023-04-01', endDate: '2023-06-30' },
  { id: 'Q1_2023', name: 'Q1 2023', startDate: '2023-01-01', endDate: '2023-03-31' }
];

/**
 * Authentication helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  async login(user = TEST_USERS.MANAGER) {
    await this.page.goto('/');
    
    // Wait for login form
    await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Fill credentials
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    
    // Submit
    await this.page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await expect(this.page).toHaveURL(/\/employees/);
  }

  async logout() {
    const logoutButton = this.page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
    await expect(this.page).toHaveURL(/\/login|\/$/);
  }
}

/**
 * API Mocking helper functions
 */
export class MockHelper {
  constructor(private page: Page) {}

  async mockAuthAPI() {
    // Mock authentication endpoints
    await this.page.route('**/auth/v1/token', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: {
            id: 'user-123',
            email: TEST_USERS.MANAGER.email,
            user_metadata: {
              name: TEST_USERS.MANAGER.name,
              role: TEST_USERS.MANAGER.role
            }
          }
        })
      });
    });

    await this.page.route('**/auth/v1/user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: TEST_USERS.MANAGER.email,
          user_metadata: {
            name: TEST_USERS.MANAGER.name,
            role: TEST_USERS.MANAGER.role
          }
        })
      });
    });
  }

  async mockEmployeesAPI() {
    await this.page.route('**/rest/v1/people*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPLOYEES)
      });
    });
  }

  async mockEvaluationScoresAPI() {
    await this.page.route('**/rest/v1/evaluation_scores*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EVALUATION_SCORES)
      });
    });
  }

  async mockQuartersAPI() {
    await this.page.route('**/rest/v1/quarters*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUARTERS)
      });
    });
  }

  async mockAllAPIs() {
    await this.mockAuthAPI();
    await this.mockEmployeesAPI();
    await this.mockEvaluationScoresAPI();
    await this.mockQuartersAPI();
  }

  async mockAPIError(endpoint: string, status = 500, message = 'Internal Server Error') {
    await this.page.route(`**/${endpoint}*`, (route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: message })
      });
    });
  }

  async mockSlowAPI(endpoint: string, delayMs = 2000) {
    await this.page.route(`**/${endpoint}*`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      route.continue();
    });
  }
}

/**
 * Navigation helper functions
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  async goToEmployeeSelection() {
    await this.page.goto('/employees');
    await expect(this.page.locator('[data-testid="employee-selection-page"]')).toBeVisible();
  }

  async goToEmployeeAnalytics(employeeId: string) {
    await this.page.goto(`/analytics/${employeeId}`);
    await expect(this.page.locator('[data-testid="analytics-page"]')).toBeVisible();
  }

  async selectEmployee(employeeName: string) {
    await this.page.fill('[data-testid="search-input"]', employeeName);
    await this.page.click('[data-testid="employee-card"]');
    await expect(this.page).toHaveURL(/\/analytics\/\w+/);
  }
}

/**
 * Chart interaction helper functions
 */
export class ChartHelper {
  constructor(private page: Page) {}

  async waitForChartsToLoad() {
    await expect(this.page.locator('[data-testid="radar-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="bar-chart"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="trend-chart"]')).toBeVisible();
  }

  async changeQuarter(quarter: string) {
    await this.page.click('[data-testid="quarter-selector"]');
    await this.page.click(`[data-testid="quarter-option-${quarter}"]`);
    await this.waitForChartsToLoad();
  }

  async verifyChartData() {
    // Verify radar chart has content
    const radarChart = this.page.locator('[data-testid="radar-chart"]');
    const chartElements = radarChart.locator('svg, canvas, .recharts-wrapper');
    await expect(chartElements.first()).toBeVisible();

    // Verify bar chart has content
    const barChart = this.page.locator('[data-testid="bar-chart"]');
    const barElements = barChart.locator('svg, canvas, .recharts-wrapper');
    await expect(barElements.first()).toBeVisible();

    // Verify trend chart has content
    const trendChart = this.page.locator('[data-testid="trend-chart"]');
    const trendElements = trendChart.locator('svg, canvas, .recharts-wrapper');
    await expect(trendElements.first()).toBeVisible();
  }
}

/**
 * Assertion helper functions
 */
export class AssertionHelper {
  static async expectGreaterThan(page: Page, locator: string, count: number) {
    const elements = page.locator(locator);
    const actualCount = await elements.count();
    expect(actualCount).toBeGreaterThan(count);
  }

  static async expectVisibleWithTimeout(page: Page, locator: string, timeout = 5000) {
    await expect(page.locator(locator)).toBeVisible({ timeout });
  }

  static async expectTextContent(page: Page, locator: string, text: string | RegExp) {
    if (typeof text === 'string') {
      await expect(page.locator(locator)).toContainText(text);
    } else {
      await expect(page.locator(locator)).toContainText(text);
    }
  }
}

/**
 * Test setup utilities
 */
export async function setupTest(page: Page, options: {
  mockAPIs?: boolean;
  loginUser?: typeof TEST_USERS.MANAGER;
  navigateTo?: string;
} = {}) {
  const { mockAPIs = true, loginUser, navigateTo } = options;

  const authHelper = new AuthHelper(page);
  const mockHelper = new MockHelper(page);
  const navHelper = new NavigationHelper(page);

  // Setup API mocks if requested
  if (mockAPIs) {
    await mockHelper.mockAllAPIs();
  }

  // Login if user specified
  if (loginUser) {
    await authHelper.login(loginUser);
  }

  // Navigate to specific page if requested
  if (navigateTo) {
    await page.goto(navigateTo);
  }

  return {
    authHelper,
    mockHelper,
    navHelper,
    chartHelper: new ChartHelper(page),
  };
} 