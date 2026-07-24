import { expect, test } from '@playwright/test'

function colorChannels(value: string) {
  if (value.startsWith('#')) {
    const hex = value.slice(1)
    return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
  }
  return value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? []
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (value: string) => {
    const channels = colorChannels(value).map((channel) => {
      const normalized = channel / 255
      return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4
    })
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2]
  }
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + .05) / (darker + .05)
}

test('builds, changes, explains, and shares a scenario', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Scenario atlas' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nuclear choices' })).toBeVisible()
  await expect(page.getByText('16 choices')).toBeVisible()
  await expect(page.getByText(/Level 0 does not mean China or North Korea is non-nuclear/i)).not.toBeVisible()

  const china = page.getByRole('radiogroup', { name: 'China nuclear posture' })
  await china.getByRole('radio', { name: 'Level 2' }).click()
  const southKorea = page.getByRole('radiogroup', { name: 'South Korea nuclear posture' })
  await southKorea.getByRole('radio', { name: 'Level 2' }).click()

  await expect(page.getByRole('region', { name: /Comparative escalation exposure map/i })).toBeVisible()
  await expect(page.locator('[data-actor]')).toHaveCount(18)
  await expect(page.locator('[data-annotation="posture-south-korea-selected-2"] [data-glyph="warhead"]')).toHaveCount(3)
  await expect(page.locator('[data-annotation="posture-japan-predicted-1"] .map-glyph--predicted')).toHaveCount(1)

  const taiwan = page.getByRole('radiogroup', { name: 'Taiwan Strait' })
  await taiwan.getByRole('radio', { name: 'No active crisis' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(taiwan.getByRole('radio', { name: 'Blockade' })).toHaveAttribute('aria-checked', 'true')
  await expect(page).toHaveURL(/tw=blockade/)

  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Share scenario' }).click()
  const shareDialog = page.getByRole('dialog', { name: 'Share this scenario' })
  await expect(shareDialog).toBeVisible()
  await shareDialog.getByRole('button', { name: 'Copy link' }).click()
  await expect(shareDialog.getByRole('status')).toContainText('Scenario link copied.')

  const copiedScenarioUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(copiedScenarioUrl).toContain('cn=2')
  expect(copiedScenarioUrl).toContain('sk=2')
  expect(copiedScenarioUrl).toContain('tw=blockade')

  const sharedPage = await context.newPage()
  await sharedPage.goto(copiedScenarioUrl)
  await expect(sharedPage.getByRole('radiogroup', { name: 'China nuclear posture' }).getByRole('radio', { name: 'Level 2' })).toBeChecked()
  await expect(sharedPage.getByRole('radiogroup', { name: 'South Korea nuclear posture' }).getByRole('radio', { name: 'Level 2' })).toBeChecked()
  await expect(sharedPage.getByRole('radiogroup', { name: 'Taiwan Strait' }).getByRole('radio', { name: 'Blockade' })).toBeChecked()
  await sharedPage.close()
  await page.getByRole('button', { name: 'Close share panel' }).click()

  const taiwanMapArea = await page.locator('.country[data-actor="taiwan"]').boundingBox()
  expect(taiwanMapArea).not.toBeNull()
  await page.mouse.click(
    taiwanMapArea!.x + taiwanMapArea!.width / 2,
    taiwanMapArea!.y + taiwanMapArea!.height / 2,
  )
  await expect(page.getByRole('heading', { name: 'Taiwan', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What changed?' })).toBeVisible()
})

test('shows author-decision evidence for Open conflict on desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop author-decision flow')
  await page.goto('/')

  const taiwan = page.getByRole('radiogroup', { name: 'Taiwan Strait' })
  await taiwan.getByRole('radio', { name: 'Open conflict' }).click()
  const conflictOutcome = page.getByRole('radiogroup', { name: 'Open-conflict outcome' })
  const lowYieldOptions = page.getByRole('radiogroup', { name: 'Chinese low-yield nuclear options' })
  await expect(conflictOutcome).toBeVisible()
  await expect(lowYieldOptions).toBeVisible()
  await conflictOutcome.getByRole('radio', { name: 'Face-saving off-ramp' }).click()
  await lowYieldOptions.getByRole('radio', { name: 'Available' }).click()
  await page.locator('.country[data-actor="china"]').click()
  await expect(page.getByRole('heading', { name: 'Low-yield availability — informational only' })).toBeVisible()
})

test('places the map above the collapsible controls on mobile and respects reduced motion', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile layout assertion')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?cn=2')

  const map = page.getByRole('region', { name: /Comparative escalation exposure map/i })
  const controls = page.locator('.controls-drawer')
  await expect(map).toBeVisible()
  const mapBox = await map.boundingBox()
  const controlsBox = await controls.boundingBox()
  expect(mapBox && controlsBox && mapBox.y < controlsBox.y).toBeTruthy()
  await expect(page.locator('.ripple')).toHaveCount(0)
  await expect(page.locator('[data-annotation]')).not.toHaveCount(0)
})

test('Taiwan blockade annotation accepts a mobile pointer 14 CSS pixels beyond its geometric edge', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile pointer target assertion')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?tw=blockade')

  const hitTarget = page.locator('[data-annotation="taiwanCrisis-blockade"] [data-testid="annotation-hit-target"]')
  await expect(hitTarget).toBeVisible()
  const point = await hitTarget.evaluate((element) => {
    const target = element as SVGGraphicsElement
    const box = target.getBBox()
    const matrix = target.getScreenCTM()
    if (!matrix) throw new Error('Taiwan blockade hit target has no screen transform')
    const midpoint = new DOMPoint(box.x, box.y + box.height / 2).matrixTransform(matrix)
    return { x: midpoint.x - 14, y: midpoint.y }
  })
  const annotationId = await page.evaluate(({ x, y }) =>
    document.elementFromPoint(x, y)?.closest('[data-annotation]')?.getAttribute('data-annotation'),
  point)
  expect(annotationId).toBe('taiwanCrisis-blockade')

  await page.mouse.click(point.x, point.y)
  await expect(page.getByRole('heading', { name: 'Taiwan', exact: true })).toBeVisible()
})

test('AI mode preserves nuclear scores and shares cited zero assessments', async ({ page }) => {
  await page.goto('/')
  const baselineChina = await page.locator('[data-actor="china"] title').textContent()

  await page.getByRole('radio', { name: 'AI' }).click()
  await page.getByRole('radiogroup', { name: 'U.S.–Japan–South Korea AI-integrated missile defense' })
    .getByRole('radio', { name: 'Selected', exact: true }).click()

  await expect(page.locator('.app-shell')).toHaveClass(/app-shell--ai/)
  await expect(page.locator('[data-actor="china"] title')).toHaveText(baselineChina ?? '')
  await expect(page.getByText('Why +0?').first()).toBeVisible()

  await page.getByRole('button', { name: 'Share scenario' }).click()
  const sharedUrl = await page.getByLabel('Shareable scenario link').inputValue()
  expect(sharedUrl).toContain('mode=ai')
  expect(sharedUrl).toContain('amd=selected')
})

test('AI theme keeps underlying annotations and drawer section labels legible', async ({ page }) => {
  await page.goto('/?mode=ai&cn=2&sk=2&tw=blockade&amd=selected')

  for (const variant of ['selected', 'predicted', 'warning']) {
    const plate = page.locator(`.annotation-stack--${variant} .annotation-plate`).first()
    await expect(plate).toBeVisible()
    await expect(plate).toHaveCSS('fill', 'rgba(16, 29, 26, 0.94)')
    await expect(plate).toHaveCSS('stroke', 'rgb(75, 105, 99)')
  }

  const aiPlate = page.locator('.annotation-stack--ai .annotation-plate').first()
  await expect(aiPlate).toBeVisible()
  await expect(aiPlate).toHaveCSS('fill', 'rgba(16, 29, 26, 0.94)')
  await expect(aiPlate).toHaveCSS('stroke', 'rgb(199, 167, 255)')

  const chinaMapArea = await page.locator('.country[data-actor="china"]').boundingBox()
  expect(chinaMapArea).not.toBeNull()
  await page.mouse.click(
    chinaMapArea!.x + chinaMapArea!.width / 2,
    chinaMapArea!.y + chinaMapArea!.height / 2,
  )
  const drawer = page.locator('.explanation-drawer')
  await expect(drawer.locator('.order-tag--direct')).toHaveCSS('color', 'rgb(114, 224, 208)')
  await expect(drawer.locator('.order-tag--second-order')).toHaveCSS('color', 'rgb(114, 224, 208)')
  await expect(drawer.locator('.order-tag:not(.order-tag--direct):not(.order-tag--second-order)')).toHaveCSS('color', 'rgb(114, 224, 208)')
})

test('selected AI actions retain their high-contrast colors on desktop hover', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop hover assertion')
  await page.goto('/?mode=ai&amd=selected')

  const aiMode = page.getByRole('radio', { name: 'AI', exact: true })
  await aiMode.hover()
  await expect(aiMode).toHaveCSS('background-color', 'rgb(114, 224, 208)')
  await expect(aiMode).toHaveCSS('color', 'rgb(7, 17, 15)')

  const selectedCondition = page.getByRole('radiogroup', { name: 'U.S.–Japan–South Korea AI-integrated missile defense' })
    .getByRole('radio', { name: 'Selected', exact: true })
  await selectedCondition.hover()
  await expect(selectedCondition).toHaveCSS('background-color', 'rgb(114, 224, 208)')
  await expect(selectedCondition).toHaveCSS('color', 'rgb(7, 17, 15)')

  await page.getByRole('button', { name: 'Share scenario' }).click()
  const copyLink = page.getByRole('button', { name: 'Copy link' })
  await copyLink.hover()
  await expect(copyLink).toHaveCSS('background-color', 'rgb(114, 224, 208)')
  await expect(copyLink).toHaveCSS('color', 'rgb(7, 17, 15)')
})

test('AI map bands use distinct shared patterns with a legible Low base', async ({ page }) => {
  await page.goto('/?mode=ai&amd=selected')

  const patterns = page.locator('pattern[data-ai-band]')
  await expect(patterns).toHaveCount(4)
  const geometries = await patterns.evaluateAll((items) => items.map((item) => (item as SVGPatternElement).dataset.patternGeometry))
  expect(new Set(geometries).size).toBe(4)

  const bandNames = ['low', 'guarded', 'high', 'critical']
  const legendFills = await Promise.all(bandNames.map(async (band) => {
    const swatch = page.locator(`.map-legend .risk-${band}`)
    const fill = await swatch.evaluate((element) => getComputedStyle(element).fill)
    expect(fill).toContain(`ai-band-${band}`)
    return fill
  }))
  expect(new Set(legendFills).size).toBe(4)

  const countryFills = await page.locator('.country[data-actor]:not([data-actor="united-states"])')
    .evaluateAll((items) => items.map((item) => getComputedStyle(item).fill))
  expect(countryFills.every((fill) => legendFills.includes(fill))).toBe(true)

  const lowBase = await page.locator('#ai-band-low [data-pattern-base]').getAttribute('fill')
  const water = await page.locator('.map-water').evaluate((element) => getComputedStyle(element).fill)
  expect(lowBase).not.toBeNull()
  expect(contrastRatio(lowBase!, water)).toBeGreaterThanOrEqual(3)

  await page.getByRole('radio', { name: 'Nuclear', exact: true }).click()
  await expect(page.locator('pattern[data-ai-band]')).toHaveCount(0)
  expect(await page.locator('.map-legend .risk-low').evaluate((element) => getComputedStyle(element).fill)).not.toContain('url')
})

test('AI zero explanation manages focus for Escape and Close', async ({ page }) => {
  await page.goto('/?mode=ai')
  await page.getByText('Country results table', { exact: true }).click()
  const zeroButton = page.getByRole('button', { name: 'Why China has modeled AI exposure plus zero' })

  await zeroButton.click()
  const drawer = page.getByRole('dialog', { name: 'China' })
  await expect(drawer).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close explanation' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(drawer).not.toBeVisible()
  await expect(zeroButton).toBeFocused()

  await zeroButton.click()
  await page.getByRole('button', { name: 'Close explanation' }).click()
  await expect(drawer).not.toBeVisible()
  await expect(zeroButton).toBeFocused()
})

test('defines every proliferation-risk color and range in both atlas layers', async ({ page }) => {
  await page.goto('/')

  const bandDefinitions = [
    {
      band: 'Low',
      color: 'Green',
      range: '0–24',
      definition: 'Limited exposure to modeled escalation conditions; little additional proliferation pressure is implied.',
    },
    {
      band: 'Guarded',
      color: 'Yellow',
      range: '25–49',
      definition: 'Meaningful but contained exposure. Some conditions could strengthen hedging incentives, but no posture change is implied.',
    },
    {
      band: 'High',
      color: 'Orange',
      range: '50–74',
      definition: 'Substantial exposure from strong or compounding conditions; incentives may increase for nuclear hedging or steps toward acquiring, expanding, or operationalizing nuclear capabilities.',
    },
    {
      band: 'Critical',
      color: 'Red',
      range: '75–100',
      definition: 'The atlas’s highest exposure range. Acute or compounding conditions may strongly intensify incentives to acquire, expand, or operationalize nuclear capabilities, but an outcome is not assumed.',
    },
  ] as const

  const legend = page.getByRole('region', { name: 'Proliferation risk' })
  const swatches = legend.locator('.risk-definition__swatch')
  const expectApprovedDefinitions = async () => {
    for (const { band, color, range, definition } of bandDefinitions) {
      const label = `${color} · ${band}`
      const item = legend.getByRole('listitem', { name: `${label} ${range}`, exact: true })
      await expect(item).toBeVisible()
      await expect(item.getByText(label, { exact: true })).toBeVisible()
      await expect(item.getByText(range, { exact: true })).toBeVisible()
      await expect(item.getByText(definition, { exact: true })).toBeVisible()
    }
  }

  await expect(legend).toBeVisible()
  await expect(legend.getByRole('listitem')).toHaveCount(4)
  await expect(swatches).toHaveCount(4)
  await expect(legend).toContainText('not a probability or forecast')
  await expectApprovedDefinitions()

  const nuclearBackgroundImages = await Promise.all(bandDefinitions.map(({ band }) =>
    legend.locator(`.risk-definition__swatch--${band.toLowerCase()}`)
      .evaluate((swatch) => getComputedStyle(swatch).backgroundImage),
  ))
  expect(nuclearBackgroundImages.every((image) => image === 'none')).toBe(true)

  await page.getByRole('radio', { name: 'AI' }).click()
  await expect(legend).toBeVisible()
  await expect(legend.getByRole('listitem')).toHaveCount(4)
  await expect(swatches).toHaveCount(4)
  await expectApprovedDefinitions()

  const aiBackgroundImages = await Promise.all(bandDefinitions.map(({ band }) =>
    legend.locator(`.risk-definition__swatch--${band.toLowerCase()}`)
      .evaluate((swatch) => getComputedStyle(swatch).backgroundImage),
  ))
  expect(aiBackgroundImages.every((image) => image !== 'none')).toBe(true)
  expect(new Set(aiBackgroundImages).size).toBe(4)
})
