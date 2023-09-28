import { Chessground } from './chessground.min.js';

import { fen, pawnAttacks, defined, opposite, SquareSet, makeSquare, parseSquare, squareRank } from './chessops.min.js';

const canCaptureEp = (pawnFrom) => {
  if (!defined(setup.epSquare)) return false;
  if (!pawnAttacks(setup.turn, pawnFrom).has(setup.epSquare)) return false;
  return true;
};

function dests() {
  const allDests = new Map();
  for (const square of setup.board[setup.turn]) {
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
    if (defined(setup.epSquare) && canCaptureEp(square)) {
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

function move(orig, dest) {
  const move = {
    from: parseSquare(orig),
    to: parseSquare(dest),
  };
  console.log("move", move);
  
  const turn = setup.turn;
  const epSquare = setup.epSquare;
  
  setup.epSquare = undefined;
  if (turn === 'black') setup.fullmoves += 1;
  setup.turn = opposite(setup.turn);
  const piece = setup.board.take(move.from);
  if (!piece) return;
  if (piece.role !== 'pawn') {
    console.log("WTF");
    return;
  }
  let epCapture = undefined;
  if (move.to === epSquare) {
    epCapture = setup.board.take(move.to + (turn === 'white' ? -8 : 8));
  }
  const delta = move.from - move.to;
  if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
    setup.epSquare = (move.from + move.to) >> 1;
  }

  if (0 == squareRank(move.to) || 7 == squareRank(move.to)) {
    console.log("game over!!!");
    winner = turn;
  }

  const capture = setup.board.set(move.to, piece) || epCapture;
  console.log("capture", capture);
}

function update(orig, dest) {
  console.log("update", orig, dest);
  move(orig, dest);
  console.log("fen", fen.makeFen(setup));
  let config = {
    fen: fen.makeFen(setup),
    turnColor: setup.turn,
  };

  if (!winner) {
    config.movable = {
      color: setup.turn,
      free: false,
      dests: dests(),
      events: {
        after: update
      }
    };
  } else {
    config.movable = {
      color: setup.turn,
      free: false,
      dests: undefined,
      events: {
        after: undefined
      }
    };

    const gameOverElement = document.createElement('div');
    gameOverElement.id = 'game-over';
    gameOverElement.style.fontSize = '80px';
    gameOverElement.style.textAlign = 'center';
    gameOverElement.innerHTML = `Game Over! ${winner} won!!!`;
    document.body.appendChild(gameOverElement);
  }
  chessground.set(config);
}

const START_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8 w - - 0 1'
const setup = fen.parseFen(START_FEN).unwrap();
let winner = undefined;

const chessground = Chessground(document.getElementById('board'), {
  fen: START_FEN,
  coordinates: true,
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