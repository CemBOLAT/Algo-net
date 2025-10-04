import React from 'react';
import { Box, Button } from '@mui/material';

const BottomActions = ({ onOpenQuickGraph, onReset, onOpenFile, onCreate }) => {
	return (
		<Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
			<Box sx={{ display: 'flex', gap: 2 }}>
				<Button 
					className="tm-modern-btn" 
					sx={{ border: '1px solid rgba(59, 130, 246, 0.3)', color: 'primary.main' }}
					onClick={onOpenQuickGraph}
				>
					Hızlı Graph
				</Button>
				<Button 
					className="tm-modern-btn" 
					sx={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: 'error.main' }}
					onClick={onReset}
				>
					Reset
				</Button>
			</Box>

			<Box sx={{ display: 'flex', gap: 2 }}>
				<Button className="tm-modern-btn" sx={{ border: '1px solid rgba(255,255,255,0.06)' }} onClick={onOpenFile}>
					Dosya Ekle
				</Button>
				<Button className="tm-modern-btn tm-modern-success" onClick={onCreate}>
					Oluştur
				</Button>
			</Box>
		</Box>
	);
};

export default BottomActions;
