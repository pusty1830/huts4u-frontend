import {
    Avatar,
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    Container,
    CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { getAllMessage } from '../../services/services';

interface Message {
    id: number;
    sender: string;
    avatar?: string;
    text: string;
    createdAt: string;
    unread: boolean;
}

const Messages = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                setError(null);

                const payload = {
                    data: { filter: "" },
                    page: 0,
                    pageSize: 50,
                    order: [["createdAt", "ASC"]],
                };

                const response = await getAllMessage(payload);

                if (response?.data?.data?.rows) {
                    // Transform API data to match our component's expected format
                    const formattedMessages = response.data.data.rows.map((msg: any) => ({
                        id: msg.id,
                        sender: msg.senderName || 'Unknown Sender',
                        avatar: msg.senderAvatar || undefined,
                        text: msg.content || 'No content',
                        createdAt: msg.createdAt,
                        unread: msg.status === 'UNREAD' // Adjust based on your API's read status
                    }));

                    setMessages(formattedMessages);
                } else {
                    setMessages([]);
                    setError('No messages found');
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Failed to load messages');
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    Messages
                </Typography>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Messages
            </Typography>

            <Box sx={{
                bgcolor: 'background.paper',
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[1],
                overflow: 'hidden'
            }}>
                {messages.length > 0 ? (
                    <List>
                        {messages.map((message) => (
                            <ListItem key={message.id} divider>
                                <ListItemAvatar>
                                    <Avatar alt={message.sender} src={message.avatar} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography
                                                fontWeight={message.unread ? 'bold' : 'normal'}
                                                color={message.unread ? 'text.primary' : 'text.secondary'}
                                            >
                                                {message.sender}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color={message.unread ? 'primary.main' : 'text.secondary'}
                                            >
                                                {new Date(message.createdAt).toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            color={message.unread ? 'text.primary' : 'text.secondary'}
                                        >
                                            {message.text}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">No messages available</Typography>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default Messages;