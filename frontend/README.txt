# OLIVIA MERINO - Frontend

## Estructura Modular del Proyecto

```
frontend/
├── pages/                  # Páginas HTML
│   ├── index.html
│   ├── productos.html
│   └── ejemplos-marca.html
│
├── styles/                 # Sistema de estilos modular
│   ├── main.css           # Archivo principal que importa todo
│   ├── base/              # Estilos base
│   │   ├── _variables.css # Variables CSS (colores, espaciado, etc.)
│   │   ├── _reset.css     # Reset y estilos base
│   │   └── _typography.css# Sistema tipográfico
│   ├── components/        # Componentes reutilizables
│   │   ├── _header.css
│   │   ├── _banner.css
│   │   ├── _hero.css
│   │   ├── _buttons.css
│   │   ├── _product-card.css
│   │   └── _footer.css
│   ├── layouts/           # Layouts y estructuras
│   │   └── _editorial.css
│   └── utils/             # Utilidades
│       ├── _colors.css    # Clases de colores
│       ├── _spacing.css   # Clases de espaciado
│       └── _grid.css      # Sistema de grid
│
├── scripts/               # JavaScript modular
│   ├── main.js           # Archivo principal
│   ├── components/       # Componentes JS
│   ├── utils/            # Utilidades
│   └── services/         # Servicios (API, etc.)
│
└── assets/               # Recursos estáticos
    └── images/
        ├── hero/
        ├── products/
        ├── services/
        └── editorial/
```

## Comandos

### Iniciar servidor frontend
```bash
npm start
```

### Ver en navegador
- http://localhost:3000/
- http://localhost:3000/productos
- http://localhost:3000/ejemplos-marca

## Sistema de Diseño

Basado en el Manual de Marca Olivia Merino:
- ✅ Colores oficiales (#F5F5F0, #2A2A2A, #1F1F1F)
- ✅ Tipografía: Poppins + Adelia
- ✅ Colores de acento controlados
- ✅ Grid editorial de 12 columnas
- ✅ Espaciado base 8px
