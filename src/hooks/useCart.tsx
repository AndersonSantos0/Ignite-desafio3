import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      if (cart.filter((product) => product.id === productId).length > 0) {
        const productAmount = cart.filter(
          (product) => product.id === productId
        )[0].amount
        updateProductAmount({ productId, amount: productAmount + 1 })
      } else {
        const response = await api.get('products/'+productId)
        const amount = 1
        const data: Product = response.data
        let selectedProduct = { ...data, amount }

        setCart([...cart, selectedProduct])
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, selectedProduct])
        )
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      if(cart.filter((product) => product.id === productId).length === 0)throw ''
      const newCart = cart.filter((product) => product.id !== productId)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) return
    try {
      const response = await api.get('stock/'+productId)
      const data: Stock = response.data
      if (amount <= data.amount) {
        let updatedCart = cart.map((product) =>
          product.id === productId ? { ...product, amount } : product
        )
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        toast.error('Quantidade solicitada fora de estoque')
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
