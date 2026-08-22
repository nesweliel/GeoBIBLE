import { expect, test } from '@playwright/test'

test('GeoBIBLE loads vector map and timeline', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'GeoBIBLE' })).toBeVisible()
  await expect(page.locator('.timeline-node')).toHaveCount(16)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })

  const canvas = page.locator('.maplibregl-canvas')
  const box = await canvas.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(500)
  expect(box?.height ?? 0).toBeGreaterThan(400)

  await expect(page.getByText('דוד בחברון ואיש־בושת במחניים', { exact: false })).toBeVisible()

  const firstPeriod = page.locator('.timeline-node').first()
  await firstPeriod.click()
  await expect(page.getByText('כניסה וכיבוש ראשוני', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'חקירה חופשית' }).click()
  await expect(page.getByText('שחקנים בתקופה')).toBeVisible()

  const relevantErrors = consoleErrors.filter(error => !/favicon|Failed to load resource.*404/.test(error))
  expect(relevantErrors).toEqual([])
})

test('GeoBIBLE scale controls keep map interactive', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'עולם' }).click()
  await page.getByRole('button', { name: 'לבנט' }).click()
  await page.getByRole('button', { name: 'מקומי' }).click()
  await page.getByRole('button', { name: 'שכבות' }).click()
  await expect(page.getByText('שחקנים ומעצמות')).toBeVisible()
})
