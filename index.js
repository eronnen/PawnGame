import { Chessground } from './chessground.min.js';

import { fen } from './chessops.min.js';
import { Chess } from './chessops.min.js';

nextTurn = (currentTurn) => { return currentTurn === 'white' ? 'black' : 'white' }

const START_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8 w - - 0 1'

const setup = fen.parseFen(START_FEN).unwrap();
let turn = 'white';

const board = Chessground(document.getElementById('board'), {
    fen: START_FEN,
    movable: {
        color: 'white',
        free: false,
        dests: fen.legalDests(START_FEN).unwrap(),
        events: {
            after: 
        }
    },
    draggable: {
        showGhost: true
    },
});