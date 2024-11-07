import React, { useState, useRef, useEffect } from 'react';
import { 
  Fab, 
  Dialog, 
  DialogContent, 
  DialogTitle,
  IconButton,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { type: 'agent', text: 'Hello! I\'m your academic assistant. I can help you with:' },
    { type: 'agent', text: '• Understanding student performance\n• Tracking academic progress\n• Generating insights about your class' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [webSocket, setWebSocket] = useState(null);
  const [initialContextSent, setInitialContextSent] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const clientId = useRef(Date.now().toString());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getPageContext = () => {
    // Get the main content area, excluding the chat interface
    const mainContent = document.querySelector('#root');
    if (!mainContent) return '';

    // Create a clone to avoid modifying the actual DOM
    const clone = mainContent.cloneNode(true);
    
    // Remove the chat dialog from the clone if it exists
    const chatDialog = clone.querySelector('[role="dialog"]');
    if (chatDialog) {
      chatDialog.remove();
    }

    // Get both HTML structure and text content
    const context = {
      html: clone.innerHTML,
      text: clone.textContent?.trim() || ''
    };

    return JSON.stringify(context);
  };

  useEffect(() => {
    if (open && !webSocket) {
      // Create WebSocket URL based on current window location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${clientId.current}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
        // Send initial context when connection opens
        if (!initialContextSent) {
          const pageContext = getPageContext();
          ws.send(JSON.stringify({
            type: 'context',
            content: pageContext
          }));
          setInitialContextSent(true);
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { type: 'agent', text: data.message }]);
        setIsLoading(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setMessages(prev => [...prev, { 
          type: 'agent', 
          text: 'I apologize, but I encountered an error. Please try again.' 
        }]);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        setWebSocket(null);
        setInitialContextSent(false);
      };

      setWebSocket(ws);
    }

    return () => {
      if (webSocket) {
        webSocket.close();
      }
    };
  }, [open, initialContextSent]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSendMessage = async () => {
    if (message.trim() && webSocket && webSocket.readyState === WebSocket.OPEN) {
      // Add user message to chat
      setMessages(prev => [...prev, { type: 'user', text: message }]);
      setIsLoading(true);
      
      // Send message through WebSocket
      webSocket.send(JSON.stringify({
        type: 'message',
        content: message
      }));
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 1000,
          '@keyframes glowPulse': {
            '0%': {
              boxShadow: '0 0 8px 3px rgba(126, 58, 242, 0.4), 0 0 15px 5px rgba(126, 58, 242, 0.2)'
            },
            '50%': {
              boxShadow: '0 0 12px 5px rgba(126, 58, 242, 0.6), 0 0 20px 8px rgba(126, 58, 242, 0.3)'
            },
            '100%': {
              boxShadow: '0 0 8px 3px rgba(126, 58, 242, 0.4), 0 0 15px 5px rgba(126, 58, 242, 0.2)'
            }
          }
        }}
      >
        <Fab
          sx={{
            bgcolor: 'rgba(126, 58, 242, 0.9)',
            color: 'white',
            boxShadow: isScrolled ? 
              '0 0 8px 3px rgba(126, 58, 242, 0.4), 0 0 15px 5px rgba(126, 58, 242, 0.2)' : 
              '0 2px 4px rgba(0,0,0,0.2)',
            width: 56,
            height: 56,
            transition: 'all 0.5s ease-in-out',
            animation: isScrolled ? 'glowPulse 1s 3s' : 'none',
            '&:hover': {
              bgcolor: 'rgba(108, 43, 217, 0.9)',
              transform: 'scale(1.05)',
              boxShadow: '0 0 15px 6px rgba(126, 58, 242, 0.6), 0 0 25px 10px rgba(126, 58, 242, 0.3)',
            },
            fontSize: '1.5rem',
          }}
          aria-label="Education AI"
          onClick={handleClickOpen}
        >
          🎓
        </Fab>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 350,
            height: isMobile ? '100%' : '70vh',
            maxHeight: isMobile ? '100%' : '70vh',
            borderRadius: isMobile ? 0 : 2,
            margin: isMobile ? 0 : 2,
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            m: 0, 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: '#7e3af2',
            color: 'white'
          }}
        >
          <div style={{ 
            fontSize: '1.25rem',
            fontWeight: 500,
            fontFamily: '"Roboto","Helvetica","Arial",sans-serif'
          }}>
            Education AI
          </div>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              color: 'white',
              padding: '12px',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <CloseIcon sx={{ fontSize: isMobile ? 28 : 24 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: isMobile ? 'calc(100% - 64px)' : '450px'
          }}
        >
          {/* Messages Container */}
          <Box 
            sx={{ 
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mb: 2
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '85%',
                    backgroundColor: msg.type === 'user' ? '#7e3af2' : '#f3f4f6',
                    color: msg.type === 'user' ? 'white' : 'text.primary',
                    borderRadius: msg.type === 'user' ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                    whiteSpace: 'pre-line',
                  }}
                >
                  <Typography variant="body1">{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#f3f4f6',
                    borderRadius: '15px 15px 15px 5px',
                  }}
                >
                  <Typography variant="body1">Thinking...</Typography>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Message Input */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about student performance..."
              variant="outlined"
              size="small"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#7e3af2',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              sx={{ 
                minWidth: 'auto', 
                p: 1,
                bgcolor: '#7e3af2',
                '&:hover': {
                  bgcolor: '#6c2bd9',
                },
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Chat;
