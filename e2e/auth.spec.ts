import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/login')
    // Verifica URL e campos do formulário
    await expect(page).toHaveURL('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display register form', async ({ page }) => {
    await page.goto('/register')
    // Verifica campos do formulário de cadastro
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button[type="submit"]')
    
    // Check for HTML5 validation or custom error messages
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('required')
    
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('text=Cadastre-se aqui')
    await expect(page).toHaveURL('/register')
    
    await page.click('text=Faça login aqui')
    await expect(page).toHaveURL('/login')
  })

  test('should redirect home to login when not logged in', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  // Note: These tests assume you have test credentials set up
  // You might want to create a test user or mock the authentication
  test.skip('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })

  test.skip('should logout successfully', async ({ page }) => {
    // First login (assuming you have a way to authenticate)
    await page.goto('/dashboard')
    
    await page.click('text=Sair')
    await expect(page).toHaveURL('/login')
  })
})