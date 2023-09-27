import { Chessground } from './chessground.min.js';

import { fen, compat, pawnAttacks, defined, opposite, SquareSet, makeSquare } from './chessops.min.js';

const canCaptureEp = (board, pawnFrom) => {
  if (!defined(board.epSquare)) return false;
  if (!pawnAttacks(board.turn, pawnFrom).has(pos.epSquare)) return false;
  return true;
};

function dests() {
  const allDests = new Map();
  for (const square of setup.board[setup.turn]) {
    console.log(square);
    const piece = setup.board.get(square);
    if (!piece || piece.color !== setup.turn) continue;
    if (piece.role !== 'pawn') {
        log.error("WTF");
        continue;
    }

    let pseudo, legal;
    pseudo = pawnAttacks(setup.turn, square).intersect(setup.board[opposite(setup.turn)]);
    const delta = setup.turn === 'white' ? 8 : -8;
    const step = square + delta;
    if (0 <= step && step < 64 && !setup.board.occupied.has(step)) {
      pseudo = pseudo.with(step);
      const canDoubleStep = setup.turn === 'white' ? square < 16 : square >= 64 - 16;
      const doubleStep = step + delta;
      if (canDoubleStep && !setup.board.occupied.has(doubleStep)) {
        pseudo = pseudo.with(doubleStep);
      }
    }
    if (defined(setup.epSquare) && canCaptureEp(setup, square)) {
      legal = SquareSet.fromSquare(setup.epSquare);
    }

    if (legal) pseudo = pseudo.union(legal);
    allDests.set(square, pseudo);
  }
  
  const result = new Map();
  for (const [from, squares] of allDests) {
    if (squares.nonEmpty()) {
      const d = Array.from(squares, makeSquare);
      result.set(makeSquare(from), d);
    }
  }

  return result;
}

function update(orig, dest) {
  console.log('update');
  board.set({
    fen: chess.move({ from: orig, to: dest }).unwrap().fen(),
    turnColor: opposite(turn)
  });
}

const START_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8 w - - 0 1'

const setup = fen.parseFen(START_FEN).unwrap();
let turn = 'white';

const board = Chessground(document.getElementById('board'), {
  fen: START_FEN,
  turnColor: setup.turn,
  movable: {
    color: setup.turn,
    free: false,
    dests: dests(),
    events: {
      after: update
    }
  },
  draggable: {
    showGhost: true
  },
});