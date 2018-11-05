import { Chessboard, VIEW } from './board';

const chessBoard = new Chessboard(VIEW.white);

chessBoard.drawBoard();
chessBoard.createPieces();
chessBoard.initListeners();