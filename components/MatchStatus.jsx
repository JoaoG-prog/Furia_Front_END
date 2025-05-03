import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Flex,
  Circle,
  VStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Grid,
} from '@chakra-ui/react';
import '../styles/MatchStatus.css';
import { FaStar, FaBomb, FaBullseye, FaFire, FaUserShield, FaSyncAlt, FaSkull, FaCrown, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

// Estado inicial da partida
const initialMatchState = {
  score: { FURIA: 0, opponent: 0 },
  map: 'MIRAGE',
  round: 1,
  phase: 'AO VIVO',
  timer: '1:45',
  maxRounds: 30,
  maxScore: 25,
  startTime: Date.now(),
  rounds: {
    FURIA: {
      won: [],
      lost: []
    },
    opponent: {
      won: [],
      lost: []
    }
  }
};

const furiaPlayers = ['FalleN', 'KSCERATO', 'yuurih', 'skullz', 'molodoy'];

const csHighlights = [
  { type: 'PLANT', icon: FaBomb, color: 'yellow.300', desc: 'Planta a C4 com sucesso no bombsite.' },
  { type: 'DEFUSE', icon: FaBomb, color: 'blue.300', desc: 'Desarma a C4 no último segundo!' },
  { type: 'ENTRY FRAG', icon: FaBullseye, color: 'orange.400', desc: 'Garante a primeira eliminação ao entrar no bombsite.' },
  { type: 'RETOMA', icon: FaSyncAlt, color: 'green.400', desc: 'Retoma o bombsite e vence o pós-plant.' },
  { type: 'CLUTCH', icon: FaUserShield, color: 'purple.300', desc: 'Vence um clutch 1vX após o plant.' },
  { type: 'ACE NO BOMB', icon: FaStar, color: 'yellow.400', desc: 'Elimina todo o time adversário defendendo ou atacando o bomb.' },
  { type: 'NINJA DEFUSE', icon: FaBomb, color: 'teal.300', desc: 'Desarma a C4 sem ser visto!' },
  { type: 'MOLLY DECISIVO', icon: FaFire, color: 'red.400', desc: 'Usa um molotov para impedir o plant ou o defuse.' },
  { type: 'SMOKE PERFEITO', icon: FaSyncAlt, color: 'gray.400', desc: 'Smoke perfeito bloqueando visão no bombsite.' },
  { type: 'TRADE RÁPIDO', icon: FaSkull, color: 'green.300', desc: 'Elimina o adversário logo após perder um companheiro no bomb.' },
  { type: 'ROUND PERFEITO', icon: FaCrown, color: 'yellow.400', desc: 'Vence o round sem perder nenhum jogador no bombsite.' },
  { type: 'ULTIMO DO PÓS-PLANT', icon: FaUserShield, color: 'purple.400', desc: 'Elimina o último adversário no pós-plant.' },
];

// Separar lances especiais em categorias
const finalHighlights = csHighlights.filter(h => 
  h.type === 'ROUND PERFEITO' || 
  h.type === 'ULTIMO DO PÓS-PLANT' || 
  h.type === 'CLUTCH' || 
  h.type === 'DEFUSE'
);

const regularHighlights = csHighlights.filter(h => !finalHighlights.includes(h));

function getCurrentMatchTime() {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
}

const getRandomHighlight = (isFinal = false) => {
  const highlights = isFinal ? finalHighlights : regularHighlights;
  const h = highlights[Math.floor(Math.random() * highlights.length)];
  const player = furiaPlayers[Math.floor(Math.random() * furiaPlayers.length)];
  return { ...h, player, team: 'FURIA', time: getCurrentMatchTime() };
};

// Estados possíveis do round
const ROUND_STATES = {
  BUY_PHASE: 'BUY_PHASE',
  ROUND_START: 'ROUND_START',
  BOMB_PLANTED: 'BOMB_PLANTED',
  BOMB_DEFUSED: 'BOMB_DEFUSED',
  ROUND_END: 'ROUND_END'
};

// Estratégias de jogo
const GAME_STRATEGIES = {
  FURIA: {
    ECO: ['PISTOL_RUSH', 'SAVE_ROUND'],
    HALF_BUY: ['FAKE_BOMB', 'MID_PUSH'],
    FULL_BUY: ['BOMB_A', 'BOMB_B', 'MID_CONTROL']
  },
  OPPONENT: {
    ECO: ['PISTOL_RUSH', 'SAVE_ROUND'],
    HALF_BUY: ['FAKE_BOMB', 'MID_PUSH'],
    FULL_BUY: ['BOMB_A', 'BOMB_B', 'MID_CONTROL']
  }
};

const mockUsers = [
  { id: 1, name: 'cs_star', isVideoOff: true, isMuted: true },
  { id: 2, name: 'cs_legend', isVideoOff: true, isMuted: true },
  { id: 3, name: 'cs_god', isVideoOff: true, isMuted: true },
  { id: 4, name: 'FuriaChampion', isVideoOff: true, isMuted: true },
];

const MatchStatus = ({ socket }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState(initialMatchState);
  const [gameTimer, setGameTimer] = useState(300);
  const [tempScore, setTempScore] = useState({ FURIA: 0, opponent: 0 });
  const [highlightTimeline, setHighlightTimeline] = useState([]);
  const [roundWinner, setRoundWinner] = useState(null);
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  const [roundMVP, setRoundMVP] = useState(null);
  const [isInterval, setIsInterval] = useState(false);
  const [lastHighlightTime, setLastHighlightTime] = useState(0);
  const [canStartScoring, setCanStartScoring] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [roundHistory, setRoundHistory] = useState({
    FURIA: { won: [], lost: [] },
    opponent: { won: [], lost: [] }
  });
  const [bombState, setBombState] = useState({
    isPlanted: false,
    timeLeft: 40,
    defuseTime: 10,
    hasKit: false
  });
  const [roundState, setRoundState] = useState(ROUND_STATES.BUY_PHASE);
  const [gameStrategy, setGameStrategy] = useState({
    FURIA: 'FULL_BUY',
    opponent: 'FULL_BUY'
  });
  const [playerStates, setPlayerStates] = useState({
    FURIA: furiaPlayers.map(player => ({
      name: player,
      alive: true,
      health: 100,
      money: 800,
      weapons: ['USP-S', 'KEVLAR']
    })),
    opponent: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'].map(player => ({
      name: player,
      alive: true,
      health: 100,
      money: 800,
      weapons: ['USP-S', 'KEVLAR']
    }))
  });
  const videoRef = useRef(null);

  // Efeito para o contador regressivo inicial
  useEffect(() => {
    if (!canStartScoring) {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanStartScoring(true);
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [canStartScoring]);

  // Efeito para iniciar o cronômetro do jogo após o countdown
  useEffect(() => {
    if (canStartScoring) {
      const gameTimerInterval = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 0) {
            clearInterval(gameTimerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(gameTimerInterval);
    }
  }, [canStartScoring]);

  // Função para processar vitória automática
  const handleAutomaticVictory = (highlight) => {
    if (highlight.type === 'ACE NO BOMB' || highlight.type === 'DEFUSE') {
      // Atualizar placar
      setTempScore(prev => ({
        FURIA: prev.FURIA + 1,
        opponent: prev.opponent
      }));

      // Atualizar histórico de rounds
      setRoundHistory(prev => {
        const newHistory = { ...prev };
        const currentRound = matchStatus.round;
        
        if (!newHistory.FURIA.won.includes(currentRound)) {
          newHistory.FURIA.won.push(currentRound);
          newHistory.opponent.lost.push(currentRound);
        }

        return newHistory;
      });

      // Mostrar banner de vitória
      setRoundWinner('FURIA');
      setRoundMVP(highlight.player);
      setShowWinnerBanner(true);
      setIsInterval(true);

      // Resetar timer e estado da bomba
      setGameTimer(30);
      setBombState({
        isPlanted: false,
        timeLeft: 40,
        defuseTime: 10,
        hasKit: false
      });

      // Atualizar status da partida
      setMatchStatus(prev => ({
        ...prev,
        round: prev.round + 1,
        score: {
          FURIA: prev.score.FURIA + 1,
          opponent: prev.score.opponent
        }
      }));
    }
  };

  // Efeito para o timer da bomba
  useEffect(() => {
    let bombInterval;
    if (bombState.isPlanted) {
      bombInterval = setInterval(() => {
        setBombState(prev => {
          if (prev.timeLeft <= 0) {
            clearInterval(bombInterval);
            return { ...prev, isPlanted: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(bombInterval);
  }, [bombState.isPlanted]);

  // Simular progresso do round
  const simulateRoundProgress = () => {
    const currentTime = 300 - gameTimer;
    
    // Fase de compra (primeiros 15 segundos)
    if (currentTime <= 15) {
      setRoundState(ROUND_STATES.BUY_PHASE);
      return;
    }

    // Início do round
    if (currentTime <= 30) {
      setRoundState(ROUND_STATES.ROUND_START);
      // Simular encontros iniciais
      if (Math.random() > 0.7) {
        const randomFuriaPlayer = Math.floor(Math.random() * playerStates.FURIA.length);
        const randomOpponent = Math.floor(Math.random() * playerStates.opponent.length);
        
        setPlayerStates(prev => {
          const newState = { ...prev };
          if (Math.random() > 0.5) {
            newState.FURIA[randomFuriaPlayer].health = 0;
            newState.FURIA[randomFuriaPlayer].alive = false;
          } else {
            newState.opponent[randomOpponent].health = 0;
            newState.opponent[randomOpponent].alive = false;
          }
          return newState;
        });
      }
      return;
    }

    // Meio do round - possibilidade de plant
    if (currentTime > 30 && currentTime < 120 && !bombState.isPlanted) {
      if (Math.random() > 0.8) {
        // Simular plant da bomba
        setBombState({
          isPlanted: true,
          timeLeft: 40,
          defuseTime: Math.random() > 0.5 ? 5 : 10,
          hasKit: Math.random() > 0.5
        });
        setRoundState(ROUND_STATES.BOMB_PLANTED);
        
        // Adicionar highlight de plant
        const plantHighlight = {
          type: 'PLANT',
          player: furiaPlayers[Math.floor(Math.random() * furiaPlayers.length)],
          team: 'FURIA',
          time: getCurrentMatchTime(),
          icon: FaBomb,
          color: 'yellow.300',
          desc: 'Planta a C4 com sucesso no bombsite.'
        };
        setHighlightTimeline(prev => [plantHighlight, ...prev]);
        socket.emit('highlight', plantHighlight);
      }
    }

    // Fase de pós-plant
    if (bombState.isPlanted) {
      // Simular tentativas de defuse
      if (Math.random() > 0.9 && bombState.timeLeft > 5) {
        const defuseAttempt = Math.random() > 0.5;
        if (defuseAttempt) {
          setRoundState(ROUND_STATES.BOMB_DEFUSED);
          const defuseHighlight = {
            type: 'DEFUSE',
            player: playerStates.opponent[Math.floor(Math.random() * playerStates.opponent.length)].name,
            team: 'OPPONENT',
            time: getCurrentMatchTime(),
            icon: FaBomb,
            color: 'blue.300',
            desc: 'Desarma a C4 no último segundo!'
          };
          setHighlightTimeline(prev => [defuseHighlight, ...prev]);
          socket.emit('highlight', defuseHighlight);
          handleAutomaticVictory(defuseHighlight);
        }
      }

      // Simular eliminações durante o pós-plant
      if (Math.random() > 0.7) {
        setPlayerStates(prev => {
          const newState = { ...prev };
          const randomTeam = Math.random() > 0.5 ? 'FURIA' : 'opponent';
          const randomPlayer = Math.floor(Math.random() * newState[randomTeam].length);
          if (newState[randomTeam][randomPlayer].alive) {
            newState[randomTeam][randomPlayer].health = 0;
            newState[randomTeam][randomPlayer].alive = false;

            // Verificar se foi uma eliminação importante
            const remainingAlive = newState[randomTeam].filter(p => p.alive).length;
            if (remainingAlive === 0) {
              const aceHighlight = {
                type: 'ACE NO BOMB',
                player: newState[randomTeam === 'FURIA' ? 'opponent' : 'FURIA'][Math.floor(Math.random() * 5)].name,
                team: randomTeam === 'FURIA' ? 'OPPONENT' : 'FURIA',
                time: getCurrentMatchTime()
              };
              setHighlightTimeline(prev => [aceHighlight, ...prev]);
              socket.emit('highlight', aceHighlight);
              if (randomTeam === 'opponent') {
                handleAutomaticVictory(aceHighlight);
              }
            }
          }
          return newState;
        });
      }
    }

    // Verificar fim do round
    const furiaAlive = playerStates.FURIA.some(p => p.alive);
    const opponentAlive = playerStates.opponent.some(p => p.alive);
    
    if (!furiaAlive || !opponentAlive) {
      setRoundState(ROUND_STATES.ROUND_END);
      const winner = !furiaAlive ? 'OPPONENT' : 'FURIA';
      handleRoundEnd(winner);
    }
  };

  // Função para recomeçar a partida
  const restartMatch = () => {
    setMatchStatus(prev => ({
      ...initialMatchState,
      map: prev.map,
      phase: 'AO VIVO'
    }));
    setTempScore({ FURIA: 0, opponent: 0 });
    setGameTimer(300);
    setRoundHistory({
      FURIA: { won: [], lost: [] },
      opponent: { won: [], lost: [] }
    });
    setHighlightTimeline([]);
    setRoundWinner(null);
    setShowWinnerBanner(false);
    setRoundMVP(null);
    setIsInterval(false);
    setBombState({
      isPlanted: false,
      timeLeft: 40,
      defuseTime: 10,
      hasKit: false
    });
  };

  // Atualizar timer e simular progresso do jogo
  useEffect(() => {
    // Atualizar placar temporário a cada 10 segundos
    const scoreInterval = setInterval(() => {
      // Só atualiza o placar se já passou o delay inicial
      if (!canStartScoring) return;

      const shouldUpdateFuria = Math.random() > 0.3;
      const shouldUpdateOpponent = Math.random() > 0.7;

      setTempScore(prev => {
        const newScore = {
          FURIA: shouldUpdateFuria ? prev.FURIA + 1 : prev.FURIA,
          opponent: shouldUpdateOpponent ? prev.opponent + 1 : prev.opponent
        };

        // Verificar se atingiu o limite de pontos
        if (newScore.FURIA >= matchStatus.maxScore || newScore.opponent >= matchStatus.maxScore) {
          clearInterval(scoreInterval);
          setMatchStatus(prev => ({
            ...prev,
            phase: 'FIM DE JOGO',
            score: newScore
          }));
          return newScore;
        }

        // Verificar se atingiu 20 pontos para opção de recomeçar
        if (newScore.FURIA === 20 || newScore.opponent === 20) {
          setMatchStatus(prev => ({
            ...prev,
            phase: 'OPÇÃO DE RECOMEÇAR',
            score: newScore
          }));
        }

        // Se FURIA marcou ponto, adicionar um lance especial
        if (newScore.FURIA > prev.FURIA) {
          const highlight = getRandomHighlight();
          setHighlightTimeline(prevTimeline => [highlight, ...prevTimeline]);
          socket.emit('highlight', highlight);
        }

        // Atualizar histórico de rounds baseado no placar
        setRoundHistory(prev => {
          const newHistory = { ...prev };
          const currentRound = matchStatus.round;
          
          if (newScore.FURIA > prev.FURIA) {
            if (!newHistory.FURIA.won.includes(currentRound)) {
              newHistory.FURIA.won.push(currentRound);
              newHistory.opponent.lost.push(currentRound);
            }
          }
          if (newScore.opponent > prev.opponent) {
            if (!newHistory.opponent.won.includes(currentRound)) {
              newHistory.opponent.won.push(currentRound);
              newHistory.FURIA.lost.push(currentRound);
            }
          }

          return newHistory;
        });

        return newScore;
      });
    }, 10000);

    // Timer principal para rodadas
    const timerInterval = setInterval(() => {
      setGameTimer((prevTimer) => {
        if (prevTimer <= 0) {
          setMatchStatus(prev => {
            const newScore = {
              FURIA: 0, // Resetar placar
              opponent: 0
            };

            // Determinar vencedor da rodada
            let winner = null;
            if (tempScore.FURIA > tempScore.opponent) winner = 'FURIA';
            else if (tempScore.opponent > tempScore.FURIA) winner = 'IMPERIAL';
            else winner = 'EMPATE';

            setTimeout(() => {
              setRoundWinner(winner);
              if (winner === 'FURIA') {
                setRoundMVP(furiaPlayers[Math.floor(Math.random() * furiaPlayers.length)]);
              } else {
                setRoundMVP(null);
              }
              setShowWinnerBanner(true);
              setIsInterval(true);
              setGameTimer(30);
              setTempScore(newScore); // Resetar placar temporário
            }, 300);

            // Atualizar histórico de rounds ao final da rodada
            setRoundHistory(prev => {
              const newHistory = { ...prev };
              const currentRound = prev.round;

              if (winner === 'FURIA') {
                if (!newHistory.FURIA.won.includes(currentRound)) {
                  newHistory.FURIA.won.push(currentRound);
                  newHistory.opponent.lost.push(currentRound);
                }
              } else if (winner === 'IMPERIAL') {
                if (!newHistory.opponent.won.includes(currentRound)) {
                  newHistory.opponent.won.push(currentRound);
                  newHistory.FURIA.lost.push(currentRound);
                }
              }

              return newHistory;
            });

            // Verificar vitória
            if (newScore.FURIA >= 16) {
              clearInterval(scoreInterval);
              return {
                ...prev,
                score: newScore,
                phase: 'VITÓRIA DA FURIA! 🏆',
                rounds: roundHistory
              };
            }

            // Jogo continua
            return {
              ...prev,
              round: prev.round + 1,
              score: newScore,
              rounds: roundHistory
            };
          });

          // Resetar placar temporário e estado da bomba
          setTempScore({
            FURIA: 0,
            opponent: 0
          });
          setBombState({
            isPlanted: false,
            timeLeft: 40,
            defuseTime: 10,
            hasKit: false
          });
          return 300;
        }

        // Simular progresso do round
        simulateRoundProgress();

        return prevTimer - 1;
      });
    }, 1000);

    // Simular atualizações de energia da torcida
    const energyInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        socket.emit('crowd_energy_update', {
          energy: Math.floor(Math.random() * 30) + 70
        });
      }
    }, 3000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(scoreInterval);
      clearInterval(energyInterval);
    };
  }, [socket, lastHighlightTime, matchStatus.round, playerStates, bombState, canStartScoring]);

  // Detectar fim de rodada e mostrar vencedor e MVP
  useEffect(() => {
    let winnerTimeout;
    if (roundWinner) {
      setShowWinnerBanner(true);
      // Só esconde o banner se NÃO estiver no intervalo
      if (!isInterval) {
        winnerTimeout = setTimeout(() => {
          setShowWinnerBanner(false);
          setRoundWinner(null);
          setRoundMVP(null);
        }, 5000);
      }
    }
    return () => clearTimeout(winnerTimeout);
  }, [roundWinner, isInterval]);

  // Quando o intervalo termina, inicia nova rodada
  useEffect(() => {
    if (isInterval && gameTimer === 0) {
      setIsInterval(false);
      setShowWinnerBanner(false);
      setRoundWinner(null);
      setRoundMVP(null);
      setGameTimer(300); // 5 minutos para a próxima rodada
    }
  }, [isInterval, gameTimer]);

  // Efeito para gerenciar o stream de vídeo
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(e => console.error('Erro ao reproduzir vídeo:', e));
    }
  }, [localStream]);

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderRoundDots = (teamRounds, isLeft) => {
    const dots = [];
    const maxRoundsHalf = Math.ceil(matchStatus.maxRounds / 2);
    
    for (let i = 1; i <= maxRoundsHalf; i++) {
      const isWon = teamRounds.won.includes(i);
      const isLost = teamRounds.lost.includes(i);
      dots.push(
        <Circle
          key={i}
          size="2"
          bg={isWon ? "yellow.400" : isLost ? "red.400" : "whiteAlpha.400"}
          mx="1"
        />
      );
    }
    return isLeft ? dots : dots.reverse();
  };

  // Atualizar status da partida via socket
  useEffect(() => {
    socket.on('match_update', (update) => {
      setMatchStatus(prev => ({ ...prev, ...update }));
    });

    return () => {
      socket.off('match_update');
    };
  }, [socket]);

  // Função para iniciar a Watch Party
  const startWatchParty = async () => {
    try {
      setIsLoading(true);
      onOpen();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      setLocalStream(stream);
    } catch (error) {
      console.error('Erro ao acessar câmera/microfone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para encerrar a Watch Party
  const stopWatchParty = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    onClose();
  };

  // Função para mutar/desmutar áudio
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Função para ligar/desligar vídeo
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <Box w="full" position="relative">
      {/* Main Score Container */}
      <Box
        bg="rgba(0, 0, 0, 0.85)"
        borderBottom="4px solid"
        borderColor={
          matchStatus.phase.includes('VITÓRIA') ? "yellow.400" :
          matchStatus.phase === 'FIM DE JOGO' ? "red.400" :
          matchStatus.phase === 'OPÇÃO DE RECOMEÇAR' ? "green.400" :
          "gray.600"
        }
        position="relative"
        borderRadius="lg"
        overflow="hidden"
        transition="all 0.3s ease"
      >
        {/* Teams and Score */}
        <Flex align="center" justify="space-between" position="relative">
          {/* FURIA Side */}
          <Flex 
            flex="1" 
            bg={`linear-gradient(90deg, ${tempScore.FURIA > tempScore.opponent ? 'rgba(255,77,0,0.3)' : 'rgba(255,77,0,0.15)'}, transparent)`}
            p={3} 
            align="center"
            transition="all 0.3s ease"
          >
            <Text 
              color="white" 
              fontWeight="bold" 
              fontSize="xl" 
              mr={4}
              textShadow="0 0 10px rgba(255,77,0,0.3)"
            >
              FURIA
            </Text>
            <Text 
              color="yellow.400" 
              fontWeight="bold" 
              fontSize="4xl"
              textShadow="0 0 15px rgba(255,204,0,0.4)"
              transition="all 0.3s ease"
            >
              {tempScore.FURIA}
            </Text>
          </Flex>

          {/* Timer */}
          <Box
            bg={!canStartScoring ? "blue.400" : 
                gameTimer <= 30 && !isInterval ? "red.500" : "yellow.400"}
            px={6}
            py={2}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            borderRadius="0 0 8px 8px"
            boxShadow="0 0 15px rgba(255,204,0,0.3)"
            transition="all 0.3s ease"
          >
            <Text 
              color="black" 
              fontWeight="bold" 
              fontSize="xl"
              fontFamily="monospace"
            >
              {!canStartScoring ? `Iniciando em ${countdown}s` : 
               isInterval ? `Intervalo: ${formatTimer(gameTimer)}` : 
               formatTimer(gameTimer)}
            </Text>
          </Box>

          {/* Imperial Side */}
          <Flex 
            flex="1" 
            bg={`linear-gradient(270deg, ${tempScore.opponent > tempScore.FURIA ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.15)'}, transparent)`}
            p={3} 
            align="center" 
            justify="flex-end"
            transition="all 0.3s ease"
          >
            <Text 
              color="yellow.400" 
              fontWeight="bold" 
              fontSize="4xl"
              textShadow="0 0 15px rgba(255,204,0,0.4)"
              transition="all 0.3s ease"
            >
              {tempScore.opponent}
            </Text>
            <Text 
              color="white" 
              fontWeight="bold" 
              fontSize="xl" 
              ml={4}
              textShadow="0 0 10px rgba(0,240,255,0.3)"
            >
              IMPERIAL
            </Text>
          </Flex>
        </Flex>

        {/* Round Indicators with Legend */}
        <Box px={4} py={2}>
          <Flex justify="space-between" mb={2}>
            <HStack spacing={0}>
              {renderRoundDots(roundHistory.FURIA, true)}
            </HStack>
            <HStack spacing={0}>
              {renderRoundDots(roundHistory.opponent, false)}
            </HStack>
          </Flex>
          <Flex justify="center" gap={4} fontSize="xs" color="gray.400">
            <HStack>
              <Circle size="2" bg="yellow.400" />
              <Text>Rounds Vencidos</Text>
            </HStack>
            <HStack>
              <Circle size="2" bg="red.400" />
              <Text>Rounds Perdidos</Text>
            </HStack>
          </Flex>
        </Box>

        {/* Botão de recomeçar quando atingir 20 pontos */}
        {matchStatus.phase === 'OPÇÃO DE RECOMEÇAR' && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="rgba(0, 0, 0, 0.8)"
            p={4}
            borderRadius="md"
            textAlign="center"
            zIndex={10}
          >
            <Text color="white" fontSize="lg" mb={2}>
              Atingiu 20 pontos! Deseja recomeçar a partida?
            </Text>
            <Button
              colorScheme="green"
              onClick={restartMatch}
              size="lg"
            >
              Recomeçar Partida
            </Button>
          </Box>
        )}
      </Box>

      {/* Banner de vencedor da rodada */}
      {showWinnerBanner && roundWinner && (
        <Box
          mt={2}
          mb={2}
          px={6}
          py={3}
          bg={
            roundWinner === 'FURIA' ? 'yellow.400' :
            roundWinner === 'IMPERIAL' ? 'blue.400' : 'gray.500'
          }
          color={roundWinner === 'FURIA' ? 'black' : 'white'}
          borderRadius="md"
          fontWeight="bold"
          fontSize="lg"
          textAlign="center"
          boxShadow="0 0 10px rgba(0,0,0,0.15)"
        >
          {roundWinner === 'EMPATE'
            ? 'Rodada empatada!'
            : `Rodada vencida pela ${roundWinner}!`}
          {roundWinner === 'FURIA' && roundMVP && (
            <Text as="span" ml={3} color="black" fontWeight="bold" fontSize="md">
              MVP: {roundMVP}
            </Text>
          )}
        </Box>
      )}

      {/* Linha do tempo de Lances Especiais em cards */}
      <Box mt={4} mb={2} px={4} py={3} bg="gray.800" borderRadius="md" boxShadow="0 0 10px rgba(255,204,0,0.08)">
        <Text fontWeight="bold" color="yellow.400" fontSize="md" mb={2}>
          Linha do Tempo dos Lances Especiais
        </Text>
        <Box maxH="320px" overflowY="auto" display="flex" flexDirection="column" gap={3}>
          {highlightTimeline.map((h, idx) => (
            <Box key={idx} borderWidth="1px" borderRadius="md" borderColor="gray.600" bg="gray.900" p={3} display="flex" alignItems="center" gap={4}>
              <Box as={h.icon} color={h.color} fontSize="2xl" flexShrink={0} />
              <Box flex="1">
                <HStack justify="space-between" mb={1}>
                  <Text fontWeight="bold" color={h.color} fontSize="sm">{h.type}</Text>
                  <Text color="gray.400" fontSize="xs">{h.time}</Text>
                </HStack>
                <Text fontWeight="bold" color="white" fontSize="md">{h.player} <span style={{color:'#888', fontWeight:400}}>{h.team}</span></Text>
                <Text color="gray.200" fontSize="sm">{h.desc}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Watch Party Button */}
      <Button
        mt={4}
        w="full"
        colorScheme="green"
        leftIcon={<FaVideo />}
        onClick={startWatchParty}
        size="lg"
        fontSize="lg"
        fontWeight="bold"
        bgGradient="linear(to-r, green.500, green.600)"
        color="white"
        border="2px solid"
        borderColor="green.300"
        borderRadius="full"
        boxShadow="0 0 15px rgba(0,0,0,0.5)"
        _hover={{
          transform: "scale(1.02)",
          boxShadow: "0 0 20px rgba(0,255,0,0.3)"
        }}
        transition="all 0.3s ease"
      >
        Iniciar Watch Party
      </Button>

      {/* Watch Party Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={stopWatchParty} 
        size="xl"
        closeOnOverlayClick={false}
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="gray.900" border="2px solid" borderColor="green.500" maxW="900px">
          <ModalHeader color="white" borderBottom="1px solid" borderColor="gray.700">
            Watch Party ({mockUsers.length + 1} participantes)
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={4}>
            <Grid
              templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
              gap={4}
              w="full"
              mb={4}
            >
              {/* Local User Video */}
              <Box
                bg="gray.800"
                borderRadius="lg"
                overflow="hidden"
                position="relative"
                h="200px"
                border="2px solid"
                borderColor="green.500"
              >
                {isLoading ? (
                  <Flex h="full" align="center" justify="center">
                    <Text color="white" fontSize="lg">Iniciando câmera...</Text>
                  </Flex>
                ) : !localStream ? (
                  <Flex h="full" align="center" justify="center">
                    <Text color="white" fontSize="lg">Aguardando permissão...</Text>
                  </Flex>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />
                )}
                <Box
                  position="absolute"
                  bottom={2}
                  left={2}
                  bg="rgba(0,0,0,0.7)"
                  px={2}
                  py={1}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Text color="white" fontSize="sm">Você</Text>
                  {isMuted && <FaMicrophoneSlash color="red" />}
                  {isVideoOff && <FaVideoSlash color="red" />}
                </Box>
              </Box>

              {/* Mock Users */}
              {mockUsers.map(user => (
                <Box
                  key={user.id}
                  bg="gray.800"
                  borderRadius="lg"
                  overflow="hidden"
                  position="relative"
                  h="200px"
                  border="2px solid"
                  borderColor="gray.600"
                >
                  <Flex
                    h="full"
                    align="center"
                    justify="center"
                    bg="gray.700"
                    direction="column"
                    gap={2}
                  >
                    <Box
                      w="60px"
                      h="60px"
                      borderRadius="full"
                      bg="gray.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="2xl"
                      color="white"
                      textAlign="center"
                      lineHeight="60px"
                    >
                      {user.name[0].toUpperCase()}
                    </Box>
                    <Text color="white" fontSize="lg">{user.name}</Text>
                  </Flex>
                  <Box
                    position="absolute"
                    bottom={2}
                    left={2}
                    bg="rgba(0,0,0,0.7)"
                    px={2}
                    py={1}
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Text color="white" fontSize="sm">{user.name}</Text>
                    {user.isMuted && <FaMicrophoneSlash color="red" />}
                    {user.isVideoOff && <FaVideoSlash color="red" />}
                  </Box>
                </Box>
              ))}
            </Grid>

            {/* Controls */}
            <Flex justify="center" gap={4}>
              <Button
                colorScheme={isMuted ? "red" : "green"}
                onClick={toggleMute}
                size="lg"
                leftIcon={isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                isDisabled={!localStream}
                _hover={{
                  transform: "scale(1.05)",
                  boxShadow: "0 0 10px rgba(255,255,255,0.2)"
                }}
                transition="all 0.2s ease"
              >
                {isMuted ? "Desmutar" : "Mutear"}
              </Button>
              <Button
                colorScheme={isVideoOff ? "red" : "green"}
                onClick={toggleVideo}
                size="lg"
                leftIcon={isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                isDisabled={!localStream}
                _hover={{
                  transform: "scale(1.05)",
                  boxShadow: "0 0 10px rgba(255,255,255,0.2)"
                }}
                transition="all 0.2s ease"
              >
                {isVideoOff ? "Ligar Câmera" : "Desligar Câmera"}
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Map and Round Info */}
      <Flex justify="space-between" mt={8}>
        <Badge
          colorScheme="purple"
          px={4}
          py={2}
          borderRadius="full"
          bg="rgba(128, 90, 213, 0.2)"
          fontSize="md"
          fontWeight="bold"
          display="flex"
          alignItems="center"
          gap={2}
        >
          MAPA: {matchStatus.map}
        </Badge>
        <Badge
          colorScheme="blue"
          px={4}
          py={2}
          borderRadius="full"
          bg="rgba(66, 153, 225, 0.2)"
          fontSize="md"
          fontWeight="bold"
        >
          RODADA {matchStatus.round}
        </Badge>
      </Flex>
    </Box>
  );
};

export default MatchStatus; 