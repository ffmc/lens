import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const categories = {
  Furniture: {
    Tables: { baseMargin: -0.15, variance: 0.08, avgSale: 650 },
    Bookcases: { baseMargin: -0.04, variance: 0.06, avgSale: 290 },
    Chairs: { baseMargin: 0.07, variance: 0.05, avgSale: 380 },
    Furnishings: { baseMargin: 0.15, variance: 0.04, avgSale: 85 },
  },
  'Office Supplies': {
    Labels: { baseMargin: 0.28, variance: 0.04, avgSale: 18 },
    Paper: { baseMargin: 0.22, variance: 0.05, avgSale: 35 },
    Envelopes: { baseMargin: 0.24, variance: 0.04, avgSale: 22 },
    Fasteners: { baseMargin: 0.30, variance: 0.03, avgSale: 12 },
    Art: { baseMargin: 0.18, variance: 0.05, avgSale: 28 },
    Binders: { baseMargin: 0.08, variance: 0.07, avgSale: 42 },
    Storage: { baseMargin: 0.11, variance: 0.06, avgSale: 65 },
    Supplies: { baseMargin: -0.03, variance: 0.06, avgSale: 48 },
    Appliances: { baseMargin: 0.12, variance: 0.06, avgSale: 155 },
  },
  Technology: {
    Phones: { baseMargin: 0.16, variance: 0.05, avgSale: 420 },
    Accessories: { baseMargin: 0.22, variance: 0.04, avgSale: 95 },
    Machines: { baseMargin: 0.04, variance: 0.08, avgSale: 1200 },
    Copiers: { baseMargin: 0.27, variance: 0.05, avgSale: 2800 },
  },
}

const regions = ['East', 'West', 'Central', 'South']
const segments = ['Consumer', 'Corporate', 'Home Office']
const shipModes = ['Standard Class', 'Second Class', 'First Class', 'Same Day']

const regionStates = {
  East: ['New York', 'Pennsylvania', 'Massachusetts', 'New Jersey', 'Connecticut', 'Virginia'],
  West: ['California', 'Washington', 'Oregon', 'Colorado', 'Nevada', 'Arizona'],
  Central: ['Illinois', 'Texas', 'Ohio', 'Michigan', 'Missouri', 'Minnesota'],
  South: ['Florida', 'Georgia', 'North Carolina', 'Tennessee', 'Alabama', 'Louisiana'],
}

const cities = {
  'New York': ['New York City', 'Buffalo', 'Albany'],
  Pennsylvania: ['Philadelphia', 'Pittsburgh', 'Allentown'],
  Massachusetts: ['Boston', 'Worcester', 'Springfield'],
  'New Jersey': ['Newark', 'Jersey City', 'Paterson'],
  Connecticut: ['Bridgeport', 'New Haven', 'Hartford'],
  Virginia: ['Virginia Beach', 'Norfolk', 'Richmond'],
  California: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
  Washington: ['Seattle', 'Spokane', 'Tacoma'],
  Oregon: ['Portland', 'Eugene', 'Salem'],
  Colorado: ['Denver', 'Colorado Springs', 'Aurora'],
  Nevada: ['Las Vegas', 'Reno', 'Henderson'],
  Arizona: ['Phoenix', 'Tucson', 'Mesa'],
  Illinois: ['Chicago', 'Aurora', 'Rockford'],
  Texas: ['Houston', 'San Antonio', 'Dallas', 'Austin'],
  Ohio: ['Columbus', 'Cleveland', 'Cincinnati'],
  Michigan: ['Detroit', 'Grand Rapids', 'Warren'],
  Missouri: ['Kansas City', 'St. Louis', 'Springfield'],
  Minnesota: ['Minneapolis', 'St. Paul', 'Rochester'],
  Florida: ['Jacksonville', 'Miami', 'Tampa', 'Orlando'],
  Georgia: ['Atlanta', 'Columbus', 'Savannah'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro'],
  Tennessee: ['Memphis', 'Nashville', 'Knoxville'],
  Alabama: ['Birmingham', 'Montgomery', 'Mobile'],
  Louisiana: ['New Orleans', 'Baton Rouge', 'Shreveport'],
}

const products = {
  Tables: [
    'Bretford CR4500 Series Slim Rectangular Table',
    'Bevis Steel Folding Table',
    'Chromcraft Bull-Nose Wood 48"x 24" Rectangular Table',
    'Harmonics Envision Training Table',
    'Global Adaptabilities Collection Flip Top Table',
  ],
  Bookcases: [
    'Bush Westfield Collection Bookcases',
    'Sauder Cornerstone Collection Bookcase',
    'Atlantic Metals Mobile Heavy-Gauge Shelving Cart',
    'O\'Sullivan 5-Shelf Bookcase in Fawn Finish',
  ],
  Chairs: [
    'Hon Deluxe Fabric Upholstered Stacking Chairs',
    'Safco PlanMaster High-Back Chair',
    'Global Leather Executive Chair',
    'Office Star Executive High Back Chair',
    'Harbour Creations 67200 Series Stacking Chair',
  ],
  Furnishings: [
    'Eldon Expressions Desk Accessories Collection',
    'Tensor "Midnight Black" Torchiere Floor Lamp',
    'Seth Thomas 6" Globe Clock',
    'Deflect-o Superior Image Shower Guard Locking Tabletop Display',
  ],
  Labels: ['Avery 491 Tab Dividers', 'Avery Self-Adhesive Removable Labels', 'Avery Laser Address Labels'],
  Paper: [
    'Xerox 1967',
    'Hammermill CopyPlus Copy Paper',
    'Xerox 4200 Series Multi-Use Copy Paper',
    'Easy-staple paper',
  ],
  Envelopes: [
    'Jiffy Kraft Padded Mailers',
    'Poly String & Button Envelopes',
    'Staple envelope',
  ],
  Fasteners: ['Avery Binding System Hidden Tab Executive Style Index Systems', 'Staples in Misc. Colors'],
  Art: ['Newell 331', 'Fiskars 8" Scissors', 'Dixon Oriole Highlighters', 'Boston 1645 Pencil Sharpener'],
  Binders: [
    'Cardinal EasyOpen D-Ring Binder',
    'GBC Standard Thermo-Bind Covers',
    'Wilson Jones Heavy Gauge Vinyl View Binder',
    'Acco Pressboard Covers with Storage Hooks',
  ],
  Storage: [
    'Storex Industrial Stacking Drawer/Organizer',
    'Tennsco Steel Storage Cabinet',
    'Iris 3-Drawer Cabinet',
    '3M Hangers with Command Adhesive',
  ],
  Supplies: [
    'Fiskars Folding Scissors',
    'Belkin 6 Outlet Metallic Surge Strip',
    'World War II Commemoration Comm.',
  ],
  Appliances: [
    'Hoover Replacement Bags for Commercial Vacuums',
    'KitchenAid 5-Speed Ultra Power Blender',
    'Cuisinart SM-50BC 5.5 Quart Stand Mixer',
    'Holmes Replacement Filter for Air Purifier',
  ],
  Phones: [
    'GE 30524EE4 Dect 6.0 Cordless Phone',
    'Apple iPhone SE (2nd Generation)',
    'Motorola 6200 Series VVX 600',
    'Cisco SPA 501G IP Phone',
    'Samsung Galaxy Tab 4 (10.1")',
  ],
  Accessories: [
    'Logitech MK550 Wireless Wave Keyboard and Mouse Bundle',
    'Plantronics CS50 Wireless Headset System',
    'Kensington Spin Drive Portable USB Drive',
    'Verbatim 25 GB 6x Blu-Ray Single Discs',
    'Targus Ultralife Rolling Laptop Case',
  ],
  Machines: [
    'Hewlett-Packard LaserJet 3310 Copier',
    'Brother Fax Machine 775',
    'Ativa V4110MDD Shredder',
    'Xerox WorkCentre 6505DN',
  ],
  Copiers: [
    'Hewlett Packard LaserJet 1010',
    'Canon imageCLASS D320 Copier',
    'Sharp Wireless All-In-One Inkjet Printer',
    'Xerox WorkCentre 3220 Multifunction Laser Printer',
  ],
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1))
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

function generateDiscount(category, subCategory, year) {
  // High discounts on certain categories, West region had discount promo in 2022
  if (subCategory === 'Tables' || subCategory === 'Bookcases') {
    return Math.round(rand(0.1, 0.45) * 20) / 20
  }
  if (subCategory === 'Supplies' || subCategory === 'Binders') {
    return Math.round(rand(0.0, 0.35) * 20) / 20
  }
  return Math.round(rand(0, 0.2) * 20) / 20
}

const rows = []
let rowId = 1
let orderCounter = 1

// Generate ~900 rows across 2020-2023
const startDate = new Date('2020-01-01')
const endDate = new Date('2023-12-31')
const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24)

// West region grows faster (simulate trend)
const regionWeights = {
  East: (year) => 0.28,
  West: (year) => 0.22 + (year - 2020) * 0.03,
  Central: (year) => 0.26 - (year - 2020) * 0.01,
  South: (year) => 0.24 - (year - 2020) * 0.01,
}

const customerNames = [
  'Claire Gute', 'Darrin Van Huff', 'Sean O\'Donnell', 'Brosina Hoffman', 'Andrew Allen',
  'Irene Maddox', 'Harold Pawlan', 'Pete Kriz', 'Alejandro Grove', 'Zuschuss Donatelli',
  'Ken Black', 'Yana Sorensen', 'Nora Preis', 'Julia West', 'Jim Mitchum',
  'Keith Dawkins', 'Eric Hoffmann', 'Randall Shilling', 'Maria Bertelson', 'Art Miller',
  'Phillina Ober', 'Bill Donatelli', 'Karen Ferguson', 'Rick Bensley', 'Sylvia Foulston',
  'Gary Hwang', 'Fred Hopkins', 'Tom Ashbrook', 'Gary McGarr', 'Susan Vittorino',
]

for (let year = 2020; year <= 2023; year++) {
  const ordersThisYear = year === 2020 ? 180 : year === 2021 ? 210 : year === 2022 ? 260 : 300

  for (let i = 0; i < ordersThisYear; i++) {
    // Spread orders through the year with seasonal bump in Q4
    const monthWeights = [0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.08, 0.08, 0.09, 0.09, 0.10, 0.14]
    let rand01 = Math.random()
    let month = 0
    let cumWeight = 0
    for (let m = 0; m < 12; m++) {
      cumWeight += monthWeights[m]
      if (rand01 < cumWeight) { month = m; break }
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const day = randInt(1, daysInMonth)
    const orderDate = new Date(year, month, day)

    const orderId = `CA-${year}-${String(orderCounter++).padStart(6, '0')}`

    // Pick region weighted
    const rw = regionWeights
    const weights = [rw.East(year), rw.West(year), rw.Central(year), rw.South(year)]
    const totalW = weights.reduce((a, b) => a + b, 0)
    let rr = Math.random() * totalW
    let region = 'East'
    for (let r = 0; r < regions.length; r++) {
      rr -= weights[r]
      if (rr <= 0) { region = regions[r]; break }
    }

    const segment = pick(segments)
    const shipMode = pick(shipModes)
    const shipDays = shipMode === 'Same Day' ? 0 : shipMode === 'First Class' ? 2 : shipMode === 'Second Class' ? 3 : 5
    const shipDate = addDays(orderDate, shipDays + randInt(0, 1))

    const state = pick(regionStates[region])
    const cityList = cities[state] || ['Unknown City']
    const city = pick(cityList)

    const customerId = `CG-${String(randInt(10000, 99999))}`
    const customerName = pick(customerNames)

    // Each order has 1-3 line items
    const lineItems = randInt(1, 3)

    for (let li = 0; li < lineItems; li++) {
      const catName = pick(Object.keys(categories))
      const subCatName = pick(Object.keys(categories[catName]))
      const { baseMargin, variance, avgSale } = categories[catName][subCatName]

      const productList = products[subCatName] || [`${subCatName} Item`]
      const productName = pick(productList)
      const productId = `${catName.substring(0, 3).toUpperCase()}-${subCatName.substring(0, 3).toUpperCase()}-${String(randInt(10000, 99999))}`

      const quantity = randInt(1, 7)
      const unitPrice = avgSale * rand(0.6, 1.5)
      const sales = Math.round(unitPrice * quantity * 100) / 100

      const discount = generateDiscount(catName, subCatName, year)

      // Profit formula: discounts erode margin, high discounts flip negative
      const discountPenalty = discount > 0.3 ? discount * 1.2 : discount * 0.8
      const effectiveMargin = baseMargin - discountPenalty + rand(-variance, variance)
      const profit = Math.round(sales * effectiveMargin * 100) / 100

      rows.push({
        'Row ID': rowId++,
        'Order ID': orderId,
        'Order Date': formatDate(orderDate),
        'Ship Date': formatDate(shipDate),
        'Ship Mode': shipMode,
        'Customer ID': customerId,
        'Customer Name': customerName,
        Segment: segment,
        Country: 'United States',
        City: city,
        State: state,
        'Postal Code': String(randInt(10000, 99999)),
        Region: region,
        'Product ID': productId,
        Category: catName,
        'Sub-Category': subCatName,
        'Product Name': productName,
        Sales: sales,
        Quantity: quantity,
        Discount: discount,
        Profit: profit,
      })
    }
  }
}

// Build CSV
const headers = Object.keys(rows[0])
const csvLines = [
  headers.join(','),
  ...rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h]
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`
        return val
      })
      .join(',')
  ),
]

const outPath = join(__dirname, '../public/superstore.csv')
writeFileSync(outPath, csvLines.join('\n'))
console.log(`Generated ${rows.length} rows → public/superstore.csv`)
