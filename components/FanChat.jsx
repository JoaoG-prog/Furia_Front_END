import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Icon,
  Flex,
  Avatar,
  Badge,
  useToast,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { FaPaperPlane, FaUser, FaUsers } from 'react-icons/fa';
import '../styles/FanChat.css';

// Cores para diferentes tipos de usuários
const userColors = {
  system: "cyan.500",
  user: "orange.400"
};

// Nomes de bots para seleção aleatória
const botNames = [
  'AnaTorcedora', 'CSLover', 'bruno_97', 'FuriaFan22', 'carolzinha',
  'FuriaNation', 'CSGOMaster', 'ProGamer', 'FuriaForever', 'BrasilCS',
  'FuriaChampion', 'CSLegend', 'FuriaFanatic', 'BrasilGaming', 'FuriaPower',
  'art_fan', 'kscerato_lover', 'yuurih_supreme', 'drop_master', 'saffee_awp',
  'chelo_aim', 'furia_brasil', 'csgo_br', 'verde_amarelo', 'brasileirinho',
  'furia_army', 'cs_master', 'awp_lover', 'headshot_pro', 'clutch_king',
  'torcedor_fiel', 'furia_passion', 'cs_warrior', 'game_master', 'pro_player',
  'furia_heart', 'br_pride', 'cs_legend', 'furia_elite', 'game_pro',
  'furia_force', 'br_power', 'cs_expert', 'furia_star', 'game_king',
  'furia_master', 'br_master', 'cs_king', 'furia_pro', 'game_god',
  'furia_god', 'br_legend', 'cs_pro', 'furia_legend', 'game_expert',
  'furia_warrior', 'br_warrior', 'cs_star', 'furia_expert', 'game_star',
  'furia_queen', 'br_queen', 'cs_god', 'furia_king', 'game_legend'
];

// Mensagens dos bots para seleção aleatória
const botMessages = [
  'VAMO FURIA! 💚💛',
  'QUE JOGADA INCRÍVEL! 🔥',
  'FURIA É GIGANTE! 🐯',
  'BRASIL PRA CIMA! 🇧🇷',
  'QUE TIME SENSACIONAL! ⭐',
  'FURIA VAI VENCER! 🏆',
  'NOSSA ENERGIA TÁ ABSURDA! ⚡',
  'MELHOR TIME DO MUNDO! 🌎',
  'FURIA FAZ HISTÓRIA! 📜',
  'QUE ORGULHO DESSE TIME! 💚',
  'VAMO QUE VAMO! 💪',
  'FURIA É DIFERENCIADO! 🔝',
  'ENERGIA MÁXIMA! ⚡',
  'RUMO AO TÍTULO! 🏆',
  'FURIA IMPARÁVEL! 🚀',
  'QUE MOMENTO INCRÍVEL! 🎯',
  'FURIA DOMINA! 👑',
  'SHOW DE HABILIDADE! 🎮',
  'NINGUÉM PARA A FURIA! 🛑',
  'QUE PARTIDA ÉPICA! 🌟',
  'FURIA É PURO TALENTO! 💫',
  'VAMO PRA CIMA! 🔥',
  'FURIA BRILHANDO! ✨',
  'MOMENTO HISTÓRICO! 📊',
  'QUE PERFORMANCE! 🎯',
  'FURIA É IMBATÍVEL! 🛡️',
  'ENERGIA DA TORCIDA! 🌊',
  'RUMO À VITÓRIA! 🎖️',
  'FURIA NO COMANDO! 🎮',
  'QUE JOGADA PERFEITA! 💯'
];

// Reações dos bots para outras mensagens
const botReactions = [
  'EXATAMENTE! 💯',
  'CONCORDO TOTALMENTE! 👏',
  'ISSO MESMO! 🎯',
  'FALOU TUDO! 🗣️',
  'É ISSO AÍ! 🔥',
  'PERFEITO! ⭐',
  'SENSACIONAL! 🌟',
  'NOSSA, SIM! 🙌',
  'FALOU E DISSE! 📢',
  'É NOIS! 💪'
];

const encouragements = [
  'FURIA GIGANTE!',
  'Vamos FURIA!',
  'É agora!',
  'BORA!',
  'Pra cima deles!',
  'Ninguém segura a FURIA!',
  'É FURIA ou nada!',
  'Vamos com tudo!',
  'Bora FURIA!',
  'Acredita até o fim!',
  'É nossa!',
  'VAMO TIME!',
  'FURIA É RAÇA!',
  'Bora buscar!',
  'FURIA, FURIA, FURIA!',
];

const emojiReactions = ['🔥', '🙌', '👏', '🐯', '💪', '🏆', '😱', '🎉', '🥳', '🇧🇷', '🤩', '🦁', '🧡', '🖤', '😎'];

// Simulação de partida Bomb Defuse FURIA x IMPERIAL (mesmo array do MatchStatus)
const matchTimeline = [
  {
    round: 1,
    time: "1:55",
    chat: [
      { user: "furiafan22", msg: "VAMO FURIA! PRA CIMA! 💪🔥" },
      { user: "imperialbr", msg: "Fallen já tá posicionado, cuidado!" },
      { user: "skullzfan", msg: "SKULLZ ENTRY NO B! VAI MOLEQUE!" },
      { user: "csbrasil", msg: "Plant no bomb B, crowd vai à loucura! 💣🙌" },
      { user: "torcidafuria", msg: "KSCERATO 1v2 CLUTCH! INSANO 🔥🔥🔥" },
      { user: "imperialista", msg: "Que bala do chelo! Mas não deu..." },
    ]
  },
  {
    round: 2,
    time: "1:20",
    chat: [
      { user: "furiafanatic", msg: "Eco da IMPERIAL, bora atropelar!" },
      { user: "yuurihgod", msg: "YUURIH ACEEEEEE! 🐯🐯🐯" },
      { user: "crowd", msg: "QUE ISSO, FURIA! NINGUÉM SEGURA!" },
    ]
  },
  {
    round: 3,
    time: "1:10",
    chat: [
      { user: "imperialbr", msg: "Agora é forçado, vamo IMPERIAL!" },
      { user: "molodoybr", msg: "Molodoy double kill no A! VAMO!" },
      { user: "furiafan22", msg: "Plant no A, pressão total!" },
      { user: "imperialista", msg: "VINI clutch 1v1! RESPONDEU!" },
    ]
  },
  {
    round: 4,
    time: "1:00",
    chat: [
      { user: "furiafanatic", msg: "Forçado da FURIA, bora surpreender!" },
      { user: "crowd", msg: "FalleN 3K de AWP! O crowd ficou em silêncio..." },
    ]
  },
  {
    round: 5,
    time: "1:20",
    chat: [
      { user: "skullzfan", msg: "SKULLZ entry no B de novo!" },
      { user: "csbrasil", msg: "Plant rápido, IMPERIAL salva armas!" },
    ]
  },
  {
    round: 6,
    time: "1:35",
    chat: [
      { user: "imperialbr", msg: "Eco da FURIA, IMPERIAL aproveita!" },
      { user: "torcidafuria", msg: "KSCERATO 2K de pistola! QUASE!" },
    ]
  },
  {
    round: 7,
    time: "1:15",
    chat: [
      { user: "furiafan22", msg: "FULL BUY, AGORA É NOSSA!" },
      { user: "yuurihgod", msg: "YUURIH TRIPLE! VAMO!" },
    ]
  },
  {
    round: 8,
    time: "1:00",
    chat: [
      { user: "imperialista", msg: "Chelo entry no A, IMPERIAL plant!" },
      { user: "crowd", msg: "Retake perfeito da FURIA! DEFUSE!" },
    ]
  },
  {
    round: 9,
    time: "1:40",
    chat: [
      { user: "furiafanatic", msg: "MOLLE DECISIVO DO MOLODOY! 🔥" },
      { user: "csbrasil", msg: "Plant no B, crowd explode!" },
    ]
  },
  {
    round: 10,
    time: "1:20",
    chat: [
      { user: "torcidafuria", msg: "KSCERATO ACE! MVP DEMAIS! 🏆" },
      { user: "imperialbr", msg: "GG, FURIA muito forte hoje..." },
    ]
  },
];

const FanChat = ({ socket, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [bots, setBots] = useState([]);
  const messagesEndRef = useRef(null);
  const messageQueueRef = useRef([]);
  const toast = useToast();
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [simRound, setSimRound] = useState(0);

  // Memoize only the last 100 messages for rendering
  const visibleMessages = useMemo(() => {
    return messages.slice(-100);
  }, [messages]);

  // Otimizar scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  // Processar fila de mensagens em lotes
  useEffect(() => {
    const processMessageQueue = setInterval(() => {
      if (messageQueueRef.current.length > 0) {
        const messagesToAdd = messageQueueRef.current.splice(0, 5); // Processa 5 mensagens por vez
        setMessages(prev => [...prev, ...messagesToAdd]);
      }
    }, 500); // Atualiza a cada meio segundo

    return () => clearInterval(processMessageQueue);
  }, []);

  // Scroll suave apenas quando necessário
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.user === username || messages.length % 5 === 0) {
        scrollToBottom();
      }
    }
  }, [messages, username, scrollToBottom]);

  // Inicializar usuários
  useEffect(() => {
    const numBots = 60;
    const newBots = [];
    const usedNames = new Set();
    
    while (newBots.length < numBots) {
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      if (!usedNames.has(botName)) {
        usedNames.add(botName);
        newBots.push({
          id: `user-${newBots.length}`,
          name: botName,
          isBot: false
        });
      }
    }
    
    setBots(newBots);
    setActiveUsers([...newBots, { id: socket.id, name: username, isBot: false }]);
    
    // Entrada gradual dos usuários em lotes
    const batchSize = 5;
    for (let i = 0; i < newBots.length; i += batchSize) {
      const batch = newBots.slice(i, i + batchSize);
      setTimeout(() => {
        batch.forEach(bot => {
          messageQueueRef.current.push({
            text: `${bot.name} entrou no chat!`,
            user: 'System',
            timestamp: new Date().toLocaleTimeString()
          });
        });
      }, i * 50); // 50ms entre cada lote
    }
    
    startUserActivity(newBots);
  }, []);

  // Simulação otimizada de atividade dos usuários
  const startUserActivity = (userList) => {
    // Dividir usuários em grupos para reduzir a frequência de mensagens
    const groups = [];
    for (let i = 0; i < userList.length; i += 10) {
      groups.push(userList.slice(i, i + 10));
    }

    groups.forEach((group, groupIndex) => {
      setInterval(() => {
        const activeUsers = group.filter(() => Math.random() > 0.8); // 20% de chance por grupo
        
        activeUsers.forEach(user => {
          const messageData = {
            text: botMessages[Math.floor(Math.random() * botMessages.length)],
            user: user.name,
            timestamp: new Date().toLocaleTimeString(),
            isBot: false
          };

          messageQueueRef.current.push(messageData);
        });
      }, Math.floor(Math.random() * 3000) + 5000); // 5 a 8 segundos
    });
  };

  // Otimizar envio de mensagem
  const handleSendMessage = useCallback(() => {
    if (newMessage.trim()) {
      const messageData = {
        text: newMessage.trim(),
        user: username,
        timestamp: new Date().toLocaleTimeString(),
        isBot: false
      };

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.text !== messageData.text || lastMessage.user !== messageData.user) {
        setMessages(prev => [...prev, messageData]);
        socket.emit('message', messageData);
        setNewMessage('');
        scrollToBottom();

        // Resposta automática de incentivo
        const lowerMsg = newMessage.trim().toLowerCase();
        if (lowerMsg.includes('bora time') || lowerMsg === 'bora' || lowerMsg.includes('bora')) {
          setTimeout(() => {
            const randomFan = bots.length > 0 ? bots[Math.floor(Math.random() * bots.length)].name : 'Torcedor';
            const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            const replyData = {
              text: encouragement,
              user: randomFan,
              timestamp: new Date().toLocaleTimeString(),
              isBot: false
            };
            setMessages(prev => [...prev, replyData]);
          }, 800); // Pequeno delay para parecer natural
        }
      } else {
        toast({
          title: "Mensagem duplicada",
          description: "Você já enviou esta mensagem. Por favor, envie algo diferente.",
          status: "warning",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }
    }
  }, [newMessage, messages, username, socket, toast, scrollToBottom, bots]);

  // Otimizar handler de tecla
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Listeners de eventos do Socket
  useEffect(() => {
    // Remover listeners antigos para evitar duplicação
    socket.off('message');
    socket.off('user_joined');
    socket.off('user_left');

    // Adicionar novos listeners
    socket.on('message', (message) => {
      // Só adiciona a mensagem se não for do próprio usuário
      if (message.user !== username) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    socket.on('user_joined', (user) => {
      setActiveUsers(prev => {
        // Evita duplicação de usuários
        if (!prev.find(u => u.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
    });
    
    socket.on('user_left', (userId) => {
      setActiveUsers(prev => prev.filter(user => user.id !== userId));
    });
    
    return () => {
      socket.off('message');
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [socket, username]);

  // Função para enviar reação emoji
  const sendEmojiReaction = (emoji) => {
    // Envia de 2 a 4 emojis de uma vez, já com posição pré-calculada
    const count = Math.floor(Math.random() * 3) + 2;
    const newEmojis = Array.from({ length: count }, () => ({
      emoji,
      id: Date.now() + Math.random() + Math.random(),
      left: `${10 + Math.random() * 80}%`,
      top: `${40 + Math.random() * 40}px`,
    }));
    setFloatingEmojis((prev) => {
      const next = [...prev, ...newEmojis];
      const MAX = 20;
      return next.length > MAX ? next.slice(next.length - MAX) : next;
    });
  };

  // Remover emojis flutuantes após animação
  useEffect(() => {
    if (floatingEmojis.length > 0) {
      const timeout = setTimeout(() => {
        setFloatingEmojis((prev) => prev.slice(Math.min(floatingEmojis.length, prev.length)));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [floatingEmojis]);

  // Bots enviam reações aleatórias com menos frequência e quantidade
  useEffect(() => {
    const botEmojiInterval = setInterval(() => {
      if (bots.length > 0 && Math.random() > 0.5) { // 50% de chance
        const emoji = emojiReactions[Math.floor(Math.random() * emojiReactions.length)];
        const count = Math.floor(Math.random() * 2) + 1; // 1 a 2 emojis
        const newEmojis = Array.from({ length: count }, () => ({
          emoji,
          id: Date.now() + Math.random() + Math.random(),
          left: `${10 + Math.random() * 80}%`,
          top: `${40 + Math.random() * 40}px`,
        }));
        setFloatingEmojis((prev) => {
          const next = [...prev, ...newEmojis];
          const MAX = 20;
          return next.length > MAX ? next.slice(next.length - MAX) : next;
        });
      }
    }, 1200);
    return () => clearInterval(botEmojiInterval);
  }, [bots]);

  // Avança o round automaticamente a cada 8 segundos
  useEffect(() => {
    if (simRound < matchTimeline.length - 1) {
      const timer = setTimeout(() => setSimRound(simRound + 1), 8000);
      return () => clearTimeout(timer);
    }
  }, [simRound]);

  // Adiciona mensagens simuladas ao chat conforme o round avança
  useEffect(() => {
    if (matchTimeline[simRound] && matchTimeline[simRound].chat) {
      matchTimeline[simRound].chat.forEach((msg, idx) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            text: msg.msg,
            user: msg.user,
            timestamp: new Date().toLocaleTimeString(),
            isBot: false
          }]);
        }, idx * 1200); // espaça as mensagens simuladas
      });
    }
    // eslint-disable-next-line
  }, [simRound]);

  return (
    <Box
      className="fan-chat-container"
      bg="gray.900"
      borderRadius="xl"
      boxShadow="0 0 20px rgba(0, 240, 255, 0.3)"
      overflow="hidden"
      position="relative"
    >
      {/* Emojis flutuantes */}
      <Box position="absolute" left={0} right={0} top={0} zIndex={10} pointerEvents="none">
        {floatingEmojis.map((item, idx) => (
          <Box
            key={item.id}
            position="absolute"
            left={item.left}
            fontSize="2xl"
            style={{
              animation: 'floatEmoji 2s linear',
              top: item.top,
              opacity: 0.95,
              willChange: 'transform, opacity',
            }}
          >
            {item.emoji}
          </Box>
        ))}
      </Box>
      <style>{`
        @keyframes floatEmoji {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-80px) scale(1.3); opacity: 0; }
        }
      `}</style>
      <Box
        className="fan-chat-header"
        bg="gray.800"
        p={4}
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            FURIOSOS
          </Text>
          <HStack spacing={2}>
            <Icon as={FaUsers} color="green.400" />
            <Text color="green.400" fontSize="sm">
              165k torcedores online
            </Text>
          </HStack>
        </HStack>
      </Box>
      
      <Box
        className="fan-chat-messages"
        p={4}
        h="400px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
            background: 'rgba(0, 0, 0, 0.2)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#FF4A00',
            borderRadius: '4px',
          },
        }}
      >
        <VStack spacing={2} align="stretch">
          {visibleMessages.map((message, index) => (
            <Box
              key={index}
              position="relative"
            >
              <HStack
                bg={message.user === username ? 'rgba(255, 77, 0, 0.1)' : 'gray.800'}
                p={3}
                borderRadius="lg"
                borderLeft="4px solid"
                borderColor={
                  message.user === 'System' 
                    ? userColors.system 
                    : userColors.user
                }
              >
                <Icon 
                  as={FaUser}
                  color={
                    message.user === 'System' 
                      ? userColors.system 
                      : userColors.user
                  }
                />
                <VStack align="start" spacing={1} flex={1}>
                  <HStack>
                    <Text 
                      fontWeight="bold" 
                      color={
                        message.user === 'System' 
                          ? userColors.system 
                          : userColors.user
                      }
                    >
                      {message.user}
                    </Text>
                    <Text 
                      fontSize="xs" 
                      color="gray.400"
                    >
                      {message.timestamp}
                    </Text>
                  </HStack>
                  <Text color="white">{message.text}</Text>
                </VStack>
              </HStack>
              {index < messages.length - 1 && (
                <Divider borderColor="gray.700" my={2} opacity={0.3} />
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      
      <Divider borderColor="gray.700" />
      
      <Box p={2} bg="gray.800" borderBottom="1px solid" borderColor="gray.700">
        <HStack spacing={1} justify="center">
          {emojiReactions.map((emoji) => (
            <Button
              key={emoji}
              size="sm"
              variant="ghost"
              fontSize="xl"
              onClick={() => sendEmojiReaction(emoji)}
              _hover={{ bg: 'gray.700' }}
            >
              {emoji}
            </Button>
          ))}
        </HStack>
      </Box>
      
      <Box p={4} bg="gray.800">
        <HStack>
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            bg="gray.700"
            border="none"
            color="white"
            _focus={{
              outline: "none",
              boxShadow: "none",
              border: "none"
            }}
            _placeholder={{ color: 'gray.400' }}
          />
          <Button
            colorScheme="orange"
            onClick={handleSendMessage}
            leftIcon={<FaPaperPlane />}
            bg="brand.500"
          >
            Enviar
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default React.memo(FanChat); 