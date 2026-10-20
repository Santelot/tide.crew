export type Lang = 'es' | 'en';
type Dict = Record<string, string>;

// Everyday UI is Spanish. The anthem layer (creed, slogan, garment text) stays
// English in the templates themselves and is intentionally NOT translated here.
export const DICT: Record<Lang, Dict> = {
  es: {
    'nav.home': 'Inicio',
    'nav.shop': 'Tienda',
    'nav.team': 'Equipo',
    'nav.account': 'Mi cuenta',
    'nav.login': 'Entrar',
    'hero.eyebrow': 'Sin presupuesto. Con marea.',
    'hero.cta': 'Ver la tienda',
    'cart.title': 'Tu carrito',
    'cart.empty': 'Tu carrito está vacío.',
    'footer.team': 'Conoce al equipo',
    'footer.rights': '© 2026 TideCrew · Guadalajara',
    'login.signin': 'Entrar',
    'login.signup': 'Crear cuenta',
    'login.toggleToSignup': '¿Sin cuenta? Crea una',
    'login.toggleToSignin': '¿Ya tienes cuenta? Entra',
  },
  en: {
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.team': 'Team',
    'nav.account': 'My account',
    'nav.login': 'Sign in',
    'hero.eyebrow': 'No budget. Just the tide.',
    'hero.cta': 'Enter the store',
    'cart.title': 'Your cart',
    'cart.empty': 'Your cart is empty.',
    'footer.team': 'Meet the team',
    'footer.rights': '© 2026 TideCrew · Guadalajara',
    'login.signin': 'Sign in',
    'login.signup': 'Create account',
    'login.toggleToSignup': 'No account? Create one',
    'login.toggleToSignin': 'Have an account? Sign in',
  },
};
