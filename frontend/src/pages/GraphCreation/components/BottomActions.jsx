import React from 'react';
import { Box, Button } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useI18n } from '../../../context/I18nContext';

const BottomActions = ({ onOpenQuickGraph, onReset, onOpenFile, onCreate }) => {
	const { t } = useI18n();
	return (
		<Box sx={{
			mt: 2,
			p: 3,
			display: 'flex',
			flexDirection: { xs: 'column', sm: 'row' },
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: 3,
			borderTop: '1px solid',
			borderColor: 'divider'
		}}>
			<Button
				variant="outlined"
				size="large"
				sx={{
					px: 4,
					py: 1.5,
					borderRadius: 2,
					color: 'text.primary',
					borderColor: 'divider',
					bgcolor: 'background.paper',
					fontWeight: 'bold',
					textTransform: 'none',
					'&:hover': { bgcolor: 'action.hover' }
				}}
				onClick={onReset}
			>
				Reset Config
			</Button>

			<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
				<Button
					variant="outlined"
					size="large"
					sx={{
						px: 4,
						py: 1.5,
						borderRadius: 2,
						borderColor: 'divider',
						color: 'text.primary',
						fontWeight: 'bold',
						textTransform: 'none',
						'&:hover': { bgcolor: 'action.hover' }
					}}
					onClick={onOpenFile}
				>
					{t('file_add_btn')}
				</Button>

				<Button
					startIcon={<BoltIcon />}
					size="large"
					sx={{
						px: 4,
						py: 1.5,
						borderRadius: 2,
						bgcolor: 'primary.50',
						color: 'primary.main',
						fontWeight: 'bold',
						textTransform: 'none',
						border: '1px solid',
						borderColor: 'primary.200',
						'&:hover': { bgcolor: 'primary.100' }
					}}
					onClick={onOpenQuickGraph}
				>
					{t('quick_graph_btn')}
				</Button>

				<Button
					variant="contained"
					startIcon={<CheckCircleIcon />}
					size="large"
					sx={{
						px: 5,
						py: 1.5,
						borderRadius: 2,
						bgcolor: '#059669', // Emerald 600
						color: 'white',
						fontWeight: 900,
						textTransform: 'none',
						boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.2)',
						'&:hover': { bgcolor: '#047857' } // Emerald 700
					}}
					onClick={onCreate}
				>
					Create Graph
				</Button>
			</Box>
		</Box>
	);
};

export default BottomActions;
