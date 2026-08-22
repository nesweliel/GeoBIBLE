import { expect, test } from '@playwright/test'

test('GeoBIBLE V1 loads GIS map and 16-state timeline', async ({ page }) => {
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

  await expect(page.locator('.story-panel h2')).toHaveText('שתי ממלכות — ירושלים עדיין עצמאית')
  await expect(page.getByText('שכבות GIS')).toBeVisible()

  await page.locator('.timeline-node').first().click()
  await expect(page.locator('.story-panel h2')).toHaveText('כניסה וכיבוש ראשוני')

  await page.getByRole('button', { name: 'חקירה' }).click()
  await expect(page.getByText('שחקנים בתקופה')).toBeVisible()

  const relevantErrors = consoleErrors.filter(error => !/favicon|Failed to load resource.*404/.test(error))
  expect(relevantErrors).toEqual([])
})

test('GeoBIBLE V1 scale and layer controls stay interactive', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'עולם' }).click()
  await page.getByRole('button', { name: 'לבנט' }).click()
  await page.getByRole('button', { name: 'מקומי' }).click()
  await page.getByRole('button', { name: 'שכבות' }).click()
  await expect(page.getByText('אזורי שליטה והשפעה')).toBeVisible()
  await expect(page.getByText('שחקנים ומעצמות')).toBeVisible()
})

test('GeoBIBLE V1 compare and sources tools work', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'השווה' }).click()
  await expect(page.getByText('COMPARE')).toBeVisible()
  await expect(page.getByText(/קו מקווקו בהיר/)).toBeVisible()

  await page.getByRole('button', { name: 'מקורות' }).click()
  await expect(page.getByText('EVIDENCE & SOURCES')).toBeVisible()
  await expect(page.getByRole('heading', { name: /מקורות/ })).toBeVisible()
  await expect(page.getByText('2 Samuel 2')).toBeVisible()
})

test('GeoBIBLE V1 search finds historical places', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /חיפוש/ }).click()
  const input = page.getByPlaceholder('חפש עיר, שבט, ממלכה...')
  await input.fill('ירושלים')
  await expect(page.getByRole('button', { name: /ירושלים/ }).first()).toBeVisible()
})
