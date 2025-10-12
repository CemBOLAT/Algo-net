import React from 'react';
import { Alert } from '@mui/material';

const FlashMessage = ({ severity = 'info', message, sx = {} }) => {
    if (!message) return null;
    return (
        <Alert severity={severity} sx={sx}>
            {message}
        </Alert>
    );
};

export default FlashMessage;
