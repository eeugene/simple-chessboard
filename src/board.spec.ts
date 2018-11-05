import { Chessboard, VIEW, COLOR, Square } from './board';
import { King, Queen, Knight, Pawn, Bishop, Rook } from './pieces';

const chessBoardForTests = () => {
    const chessboard = new Chessboard(VIEW.white);
    chessboard.drawBoard();
    return chessboard;
}

test('Just move a piece', () => {
    const board = chessBoardForTests();
    const queen = new Queen(board, "e1", COLOR.WHITE);
    board.addPiece(queen);

    const square = board.getSquare("e8");
    expect(square).not.toBeNull();

    if (square) {

        board.tryMove(queen, square);
        expect(queen.squareId).toEqual("e8");
    } else {
        fail("The target square e8 has not been found");
    }
});

/*test('Just move a piece, from starting position', () => {
    const board = chessBoardForTests();
    board.createPieces();

    const g1Square = board.getSquare("g1");
    const knight = g1Square.piece;
    if (knight) {
        board.tryMove(knight, board.getSquare("f3"));
        expect(knight.squareId).toEqual("f3");

        expect(board.getFenNotation()).toEqual("");
    } else {
        fail("The knight should exist");
    }

});
*/

test('You cant eat the king', () => {
    const board = chessBoardForTests();

    board.addPiece(new King(board, "e8", COLOR.BLACK));
    const queen = new Queen(board, "e1", COLOR.WHITE);
    board.addPiece(queen);

    const square = board.getSquare("e8");
    expect(square).not.toBeNull();

    if (square) {

        board.tryMove(queen, square);
        expect(queen.squareId).toEqual("e1");
    }
});

test('You cant eat a piece behind another, only horses can', () => {
    const board = chessBoardForTests();

    const whiteQueen = new Queen(board, "d1", COLOR.WHITE);

    const blackQueen = new Queen(board, "d7", COLOR.BLACK);
    const blackKing = new King(board, "d8", COLOR.BLACK);
    
    board.addPiece(whiteQueen);
    board.addPiece(blackQueen);
    board.addPiece(blackKing);

    const square = board.getSquare("e8");
    expect(square).not.toBeNull();

    const whiteQueenAttackingSquares = whiteQueen.getAttackingSquares();
    const d7Square = whiteQueenAttackingSquares.find(square => square.id === "d7");
    expect(d7Square).toBeDefined();
    const d8Square = whiteQueenAttackingSquares.find(square => square.id === "d8");
    expect(d8Square).toBeUndefined();

});

test('You cant expose your king to checks', () => {
    const board = chessBoardForTests();

    const king = new King(board, "d8", COLOR.BLACK);
    const knight = new Knight(board, "d6", COLOR.WHITE);
    board.addPiece(king);
    board.addPiece(knight);
    board.changeTurn(); // black to move

    const e8_square = board.getSquare("e8");
    expect(e8_square).not.toBeNull();

    if (e8_square) {
        board.tryMove(king, e8_square);
        expect(king.squareId).toEqual("d8");
    }
});

test('You cant eat a protected piece with your king', () => {
    const board = chessBoardForTests();
    const queen = new Queen(board, "d8", COLOR.BLACK);
    const knight = new Knight(board, "d5", COLOR.BLACK);
    const king = new King(board, "d4", COLOR.WHITE);

    board.addPiece(queen);
    board.addPiece(knight);
    board.addPiece(king);

    const d5_square = board.getSquare("d5");
    expect(d5_square).not.toBeNull();

    if (d5_square) {
        board.tryMove(king, d5_square);
        expect(king.squareId).toEqual("d4");
    }
});

test('You must escape your king while in check', () => {
    const board = chessBoardForTests();
    const king = new King(board, "d1", COLOR.WHITE);
    const pawn = new Pawn(board, "g2", COLOR.WHITE);
    const knight = new Knight(board, "e3", COLOR.BLACK);
    board.addPiece(king);
    board.addPiece(knight);
    board.addPiece(pawn);

    expect(board.isInCheck()).toBeTruthy();

    //try to move another piece, not possible if it not protects your king
    board.tryMove(pawn, board.getSquare("g3"));
    expect(pawn.squareId).toEqual("g2");
    
    //try to move the king, possible
    board.tryMove(king, board.getSquare("e1"));
    expect(king.squareId).toEqual("e1");

});

test('You can move a piece to protect your king while in check', () => {
    const board = chessBoardForTests();
    const king = new King(board, "d1", COLOR.WHITE);
    const pawn = new Pawn(board, "g2", COLOR.WHITE);
    const whiteQueen = new Queen(board, "a2", COLOR.WHITE);
    const blackQueen = new Queen(board, "d8", COLOR.BLACK);
    board.addPiece(king);
    board.addPiece(whiteQueen);
    board.addPiece(blackQueen);
    board.addPiece(pawn);

    expect(board.isInCheck()).toBeTruthy();

    //try to move another piece, not possible if it not protects your king
    board.tryMove(pawn, board.getSquare("g3"));
    expect(pawn.squareId).toEqual("g2");
    
    //move the queen to protect the king, possible
    board.tryMove(whiteQueen, board.getSquare("d2"));
    expect(whiteQueen.squareId).toEqual("d2");
    expect(board.isInCheck(COLOR.WHITE)).toBeFalsy();
});

test('You cant move a pinned piece', () => {
    const board = chessBoardForTests();
    const king = new King(board, "a1", COLOR.WHITE);
    const pawn = new Pawn(board, "b2", COLOR.WHITE);
    const bishop = new Bishop(board, "h8", COLOR.BLACK);
    board.addPiece(king);
    board.addPiece(pawn);
    board.addPiece(bishop);

    expect(board.isInCheck()).toBeFalsy();

    //try to move the pinned pawn : failed
    board.tryMove(pawn, board.getSquare("b4"));
    expect(pawn.squareId).toEqual("b2");
    
    // move the king: ok
    board.tryMove(king, board.getSquare("a2"));
    expect(king.squareId).toEqual("a2");
});


test('Checkmate', () => {
    const board = chessBoardForTests();
    
    const king = new King(board, "a8", COLOR.BLACK);
    const pawn1 = new Pawn(board, "a7", COLOR.BLACK);
    const pawn2 = new Pawn(board, "b7", COLOR.BLACK);
    const pawn3 = new Pawn(board, "c7", COLOR.BLACK);
    const rook = new Rook(board, "h1", COLOR.WHITE);
    board.addPiece(king);
    board.addPiece(rook);
    board.addPiece(pawn1);
    board.addPiece(pawn2);
    board.addPiece(pawn3);

    // try to move the pinned pawn : failed
    board.tryMove(rook, board.getSquare("h8"));
    expect(rook.squareId).toEqual("h8");
    expect(board.isInCheck()).toBeTruthy();
    expect(board.isCheckmate).toBeTruthy();
});

/* todo
* [X] bouger une piece
* [X] on ne peut pas manger le roi
* [X] on ne peut pas manger 1 pièce se trouvant derrière une autre 
* [X] se mettre en échec est un coup illegal
* [X] se mettre en échec est un coup illegal, cas des pièces mangées par le roi mais protégées
* [X] ne pas parer ou sortir d'un échec est un coup illegal : sortir
* [X] ne pas parer ou sortir d'un échec est un coup illegal : parer
* [X] on ne peut pas bouger une pièce clouée
* [X] checkmate
* [ ] prise en passant, !! valable 1 fois!!
* [ ] roque

*/