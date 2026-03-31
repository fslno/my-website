export type Locale = 'English' | 'US English' | 'Tigrigna' | 'French' | 'Spanish' | 'German' | 'Japanese';

export const translations: Record<string, Record<Locale, string>> = {
  'nav.home': {
    English: 'Home',
    'US English': 'Home',
    Tigrigna: 'መበገሲ',
    French: 'Accueil',
    Spanish: 'Inicio',
    German: 'Startseite',
    Japanese: 'ホーム'
  },
  'nav.shop': {
    English: 'Shop',
    'US English': 'Shop',
    Tigrigna: 'دوካን',
    French: 'Boutique',
    Spanish: 'Tienda',
    German: 'Shop',
    Japanese: 'ショップ'
  },
  'nav.search': {
    English: 'Search',
    'US English': 'Search',
    Tigrigna: 'ድለዩ',
    French: 'Rechercher',
    Spanish: 'Buscar',
    German: 'Suche',
    Japanese: '検索'
  },
  'nav.cart': {
    English: 'Cart',
    'US English': 'Cart',
    Tigrigna: 'ካርታ',
    French: 'Panier',
    Spanish: 'Carrito',
    German: 'Warenkorb',
    Japanese: 'カート'
  },
  'nav.menu': {
    English: 'Menu',
    'US English': 'Menu',
    Tigrigna: 'ዝርዝር',
    French: 'Menu',
    Spanish: 'Menú',
    German: 'Menü',
    Japanese: 'メニュー'
  },
  'hero.shop_now': {
    English: 'Shop Now',
    'US English': 'Shop Now',
    Tigrigna: 'ሕጂ ይሸምቱ',
    French: 'Achetez Maintenant',
    Spanish: 'Comprar Ahora',
    German: 'Jetzt Shoppen',
    Japanese: '今すぐ購入'
  },
  'product.add_to_cart': {
    English: 'Add to Cart',
    'US English': 'Add to Cart',
    Tigrigna: 'ናብ ካርታ ወስኽ',
    French: 'Ajouter au Panier',
    Spanish: 'Añadir al Carrito',
    German: 'In den Warenkorb',
    Japanese: 'カートに追加'
  },
  'product.out_of_stock': {
    English: 'Out of Stock',
    'US English': 'Out of Stock',
    Tigrigna: 'ተወዲኡ',
    French: 'Rupture de Stock',
    Spanish: 'Agotado',
    German: 'Ausverkauft',
    Japanese: '在庫切れ'
  },
  'product.buy_now': {
    English: 'Buy it Now',
    'US English': 'Buy it Now',
    Tigrigna: 'ሕጂ ይግዝኡ',
    French: 'Acheter Maintenant',
    Spanish: 'Comprar Ahora',
    German: 'Jetzt Kaufen',
    Japanese: '今すぐ購入'
  },
  'filter.all': {
    English: 'All Products',
    'US English': 'All Products',
    Tigrigna: 'ኩሎም ንብረታት',
    French: 'Tous les Produits',
    Spanish: 'Todos los Productos',
    German: 'Alle Produkte',
    Japanese: 'すべての製品'
  }
};
