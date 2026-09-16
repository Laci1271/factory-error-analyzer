# 🏭 Gépsor Hiba Elemzés

Excel adatok feldolgozása és interaktív elemzése ipari gépsorokhoz.

## 📋 Funkciók

- 📤 Excel fájl feltöltés drag & drop támogatással
- 📊 Interaktív adatelemzés
- 📈 Grafikák és statisztikák
- 🎨 Szép és felhasználóbarát UI

## 🚀 Telepítés és futtatás

### Előfeltételek
- Node.js 14+
- npm vagy yarn

### Helyi futtatás

```bash
# Server telepítés és futtatás
cd server
npm install
npm start

# Új terminálban - Client telepítés és futtatás
cd client
npm install
npm start
```

### Render-en való futtatás

1. Push-eld a kódot GitHub-ra
2. Mj a Render webhelyen
3. Válassza az "New" -> "Web Service" lehetőséget
4. Csatlakoztassa a GitHub repót
5. Konfiguráció:
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `cd server && npm start`
6. Deploy!

## 🏗️ Projekt Struktúra

```
factory-error-analyzer/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # React komponensek
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Express backend
│   ├── server.js
│   └── package.json
└── render.yaml            # Render konfiguráció
```

## 📝 Támogatott Excel formátumok

- .xlsx (Excel 2007+)
- .xls (Excel 97-2003)

## 🔧 API Végpontok

### POST `/api/upload`
Excel fájl feltöltése és elemzése

**Request:**
```
Content-Type: multipart/form-data
- file: Excel fájl
- machineName: Gép neve
```

**Response:**
```json
{
  "machine": "Gép 1",
  "uploadDate": "2024-09-16T...",
  "rawData": [...],
  "analysis": {
    "errorTypes": {...},
    "topErrors": [...],
    "totalErrors": 123,
    "totalWarnings": 45,
    "totalRows": 500
  }
}
```

## 📄 Licencia

MIT
