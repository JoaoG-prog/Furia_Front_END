import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Avatar,
  Flex,
  Heading,
  useToast,
  Badge,
  IconButton,
  Grid,
  GridItem,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Portal
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaPaperPlane, FaUser, FaTrophy, FaGamepad, FaHandPaper, FaSignOutAlt, FaCamera, FaCog } from 'react-icons/fa';
import io from 'socket.io-client';
import MatchStatus from './components/MatchStatus';
import FanChat from './components/FanChat';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  cors: {
    origin: "http://localhost:3002"
  }
});

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 77, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 77, 0, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 77, 0, 0.5); }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const fadeInAnimation = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const smokeAnimation = keyframes`
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
`;

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const toast = useToast();
  const [showChat, setShowChat] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const fileInputRef = useRef();
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' });
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
      socket.emit('user_joined', username);
      toast({
        title: 'Bem-vindo ao Chat da FURIA!',
        description: `Olá, ${username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  // Função para sair
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    window.location.reload();
  };

  // Função para abrir seletor de arquivo
  const handleChangePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Função para processar upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePhoto(ev.target.result);
        toast({
          title: 'Foto de perfil atualizada!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem válida.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Função para opções de conta (placeholder)
  const handleAccountOptions = () => {
    toast({
      title: 'Funcionalidade em breve!',
      description: 'Em breve você poderá acessar opções de conta.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerData.nome || !registerData.email || !registerData.senha || !registerData.confirmarSenha) {
      toast({
        title: 'Preencha todos os campos.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (registerData.senha !== registerData.confirmarSenha) {
      toast({
        title: 'As senhas não coincidem.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    toast({
      title: 'Cadastro realizado (simulado)!',
      description: 'Em breve você poderá criar uma conta de verdade.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setShowRegister(false);
    setRegisterData({ nome: '', email: '', senha: '', confirmarSenha: '' });
  };

  if (!isLoggedIn) {
    return (
      <Container maxW="container.md" py={10} centerContent>
        <VStack spacing={6} w="100%">
          {/* Logo da FURIA */}
          <Box w="100%" display="flex" justifyContent="center">
            <img src="/furia-logo.png.png" alt="Logo FURIA" style={{ width: 90, height: 90, marginBottom: 8 }} />
          </Box>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            textAlign="center"
            mb={2}
            letterSpacing={4}
            fontFamily="'Bungee', 'Orbitron', sans-serif"
            textShadow="0 0 12px rgba(0,0,0,0.7)"
          >
            FURIA Fans
          </Text>
          <Box
            w="100%"
            maxW="400px"
            p={8}
            borderWidth={1}
            borderRadius="xl"
            bg="brand.800"
            position="relative"
            overflow="hidden"
            boxShadow="0 0 30px rgba(0,0,0,0.5)"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255,77,0,0.08), rgba(0,240,255,0.08))',
              zIndex: 0,
            }}
          >
            {!showRegister && !showForgot ? (
              <form onSubmit={handleLogin}>
                <VStack spacing={4} position="relative" zIndex={1}>
                  <Input
                    placeholder="Login ou e-mail"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                    autoComplete="username"
                  />
                  <Input
                    placeholder="Senha"
                    type="password"
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                    autoComplete="current-password"
                  />
                  <Button
                    type="submit"
                    colorScheme="orange"
                    size="lg"
                    w="100%"
                    bg="brand.500"
                    h="60px"
                    fontSize="md"
                    fontWeight="bold"
                    leftIcon={<FaHandPaper />}
                    _hover={{ bg: 'brand.600', transform: 'translateY(-2px)', boxShadow: '0 0 20px rgba(255,77,0,0.8)' }}
                  >
                    Entrar
                  </Button>
                  <HStack w="100%" justify="space-between" mt={2}>
                    <Button variant="link" colorScheme="blue" fontSize="sm" p={0} onClick={() => setShowForgot(true)}>
                      Esqueceu sua senha?
                    </Button>
                    <Button 
                      variant="link" 
                      colorScheme="orange" 
                      fontSize="sm" 
                      p={0}
                      _hover={{ color: 'brand.500' }}
                      onClick={handleRegister}
                    >
                      Cadastrar conta
                    </Button>
                    <Button
                      as="a"
                      href="https://api.whatsapp.com/send/?phone=5511993404466&text&type=phone_number&app_absent=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="link"
                      colorScheme="blue"
                      fontSize="sm"
                      p={0}
                    >
                      Suporte
                    </Button>
                  </HStack>
                </VStack>
              </form>
            ) : showRegister ? (
              <form onSubmit={handleRegisterSubmit}>
                <VStack spacing={4} position="relative" zIndex={1}>
                  <Input
                    placeholder="Nome"
                    name="nome"
                    value={registerData.nome}
                    onChange={handleRegisterChange}
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                  />
                  <Input
                    placeholder="E-mail"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                  />
                  <Input
                    placeholder="Senha"
                    name="senha"
                    type="password"
                    value={registerData.senha}
                    onChange={handleRegisterChange}
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                  />
                  <Input
                    placeholder="Confirmar senha"
                    name="confirmarSenha"
                    type="password"
                    value={registerData.confirmarSenha}
                    onChange={handleRegisterChange}
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                  />
                  <Button
                    type="submit"
                    colorScheme="orange"
                    size="lg"
                    w="100%"
                    bg="brand.500"
                    h="60px"
                    fontSize="md"
                    fontWeight="bold"
                    _hover={{ bg: 'brand.600', transform: 'translateY(-2px)', boxShadow: '0 0 20px rgba(255,77,0,0.8)' }}
                  >
                    Cadastrar
                  </Button>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    fontSize="sm"
                    p={0}
                    onClick={() => setShowRegister(false)}
                  >
                    Voltar para login
                  </Button>
                </VStack>
              </form>
            ) : (
              <form onSubmit={e => {
                e.preventDefault();
                if (!forgotEmail) {
                  toast({
                    title: 'Digite seu e-mail.',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                toast({
                  title: 'Recuperação enviada!',
                  description: 'Se o e-mail existir, você receberá instruções para redefinir sua senha.',
                  status: 'success',
                  duration: 4000,
                  isClosable: true,
                });
                setShowForgot(false);
                setForgotEmail('');
              }}>
                <VStack spacing={4} position="relative" zIndex={1}>
                  <Input
                    placeholder="Digite seu e-mail"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    size="lg"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid"
                    borderColor="rgba(255,77,0,0.2)"
                    _hover={{ borderColor: 'brand.500' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 10px rgba(255,77,0,0.3)' }}
                  />
                  <Button
                    type="submit"
                    colorScheme="orange"
                    size="lg"
                    w="100%"
                    bg="brand.500"
                    h="60px"
                    fontSize="md"
                    fontWeight="bold"
                    _hover={{ bg: 'brand.600', transform: 'translateY(-2px)', boxShadow: '0 0 20px rgba(255,77,0,0.8)' }}
                  >
                    Enviar recuperação
                  </Button>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    fontSize="sm"
                    p={0}
                    onClick={() => setShowForgot(false)}
                  >
                    Voltar para login
                  </Button>
                </VStack>
              </form>
            )}
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" h="100vh" py={4}>
      <VStack h="full" spacing={2}>
        <HStack
          w="full"
          justify="space-between"
          p={4}
          bg="brand.800"
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 20px rgba(0,0,0,0.5)"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,77,0,0.1), rgba(0,240,255,0.1))',
            zIndex: 0,
          }}
        >
          <Heading
            size="lg"
            color="brand.500"
            textShadow="0 0 10px rgba(255,77,0,0.5)"
            position="relative"
            zIndex={1}
            letterSpacing="wider"
          >
            Chat da Torcida FURIA
          </Heading>
          <Menu placement="bottom-end" autoSelect={false}>
            <MenuButton as={Button} variant="ghost" p={0} _hover={{ bg: 'transparent' }} boxShadow="lg">
              <HStack spacing={2} bg="gray.900" px={4} py={2} borderRadius="full" boxShadow="0 0 10px rgba(255,77,0,0.2)">
                <Avatar size="md" name={username} bg="orange.400" color="white" icon={<FaUser />} src={profilePhoto || undefined} />
                <Text color="orange.200" fontWeight="bold">{username}</Text>
              </HStack>
            </MenuButton>
            <Portal>
              <MenuList bg="gray.800" borderColor="gray.700" boxShadow="0 8px 32px rgba(0,0,0,0.35)" minW="220px" zIndex={3000}>
                <MenuItem icon={<Icon as={FaCamera} />} onClick={handleChangePhoto} bg="gray.800" _hover={{ bg: 'gray.700' }}>
                  Mudar foto de perfil
                </MenuItem>
                <MenuItem icon={<Icon as={FaCog} />} onClick={handleAccountOptions} bg="gray.800" _hover={{ bg: 'gray.700' }}>
                  Opções de conta
                </MenuItem>
                <MenuItem icon={<Icon as={FaSignOutAlt} />} onClick={handleLogout} bg="gray.800" _hover={{ bg: 'gray.700' }} color="red.300">
                  Sair
                </MenuItem>
              </MenuList>
              {/* Input de arquivo invisível para upload de foto */}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </Portal>
          </Menu>
        </HStack>

        <Grid
          templateColumns="repeat(2, 1fr)"
          gap={6}
          w="full"
          h="calc(100vh - 100px)"
        >
          <GridItem>
            <Box
              w="100%"
              maxW="600px"
              h="340px"
              bg="black"
              borderRadius="xl"
              boxShadow="0 0 20px rgba(0, 240, 255, 0.3)"
              overflow="hidden"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mt={2}
              ml="auto"
              mr="auto"
            >
              <iframe
                src="https://player.twitch.tv/?channel=furiatv&parent=localhost"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen"
                style={{ border: 'none', minHeight: '100%', minWidth: '100%' }}
                title="Transmissão ao vivo"
              />
            </Box>
            <Box w="100%" maxW="600px" mx="auto" mt={2}>
              <Button
                colorScheme="orange"
                w="full"
                size="lg"
                borderRadius="xl"
                fontWeight="bold"
                onClick={() => setShowChat(v => !v)}
                mb={showChat ? 2 : 0}
              >
                {showChat ? 'Fechar Chat' : 'Abrir Chat da Torcida'}
              </Button>
              {showChat && (
                <FanChat socket={socket} username={username} />
              )}
            </Box>
          </GridItem>
          <GridItem>
            <MatchStatus socket={socket} />
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
}

export default App; 