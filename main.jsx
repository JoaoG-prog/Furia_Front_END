import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import App from './App'
import './index.css'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
        backgroundImage: 'linear-gradient(to bottom, #0A0A0A, #1A1A1A)',
      },
    },
  },
  colors: {
    brand: {
      500: '#FF4A00', // FURIA orange
      600: '#CC3A00',
      700: '#00F0FF', // Neon blue
      800: '#1A1A1A', // Dark background
      900: '#0A0A0A', // Darker background
    },
  },
  components: {
    Button: {
      baseStyle: {
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: '0 0 15px rgba(255, 74, 0, 0.5)',
        },
        transition: 'all 0.2s ease-in-out',
      },
    },
    Box: {
      baseStyle: {
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 'inherit',
          background: 'linear-gradient(45deg, rgba(255,74,0,0.1), rgba(0,240,255,0.1))',
          zIndex: -1,
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        letterSpacing: 'wider',
      },
    },
    Badge: {
      baseStyle: {
        fontWeight: 'bold',
      },
    },
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
) 