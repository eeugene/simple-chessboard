
import { reverse, getHtmlElementCoords, copyInstance } from './lib';
import { Piece, Rook, Knight, Bishop, Queen, King, Pawn } from './pieces';
import { eventBus, EventType } from './EventBus';

const indices = [1, 2, 3, 4, 5, 6, 7, 8];

export const VIEW = {
    white: { columns: [...indices], rows: [...reverse(indices)] },
    black: { columns: [...reverse(indices)], rows: [...indices] }
}

export enum COLOR {
    WHITE = 1, BLACK
}

export class Chessboard {

    public pieces: Piece[] = [];
    private squares: Square[] = [];
    private turn: COLOR;
    public isCheckmate: boolean = false;

    constructor(public currentView: any) {
        this.currentView = VIEW.white;
        this.turn = COLOR.WHITE;

        // create squares instances
        this.currentView.rows.forEach((i: number) =>
            this.currentView.columns.forEach((j: number) => {
                const letter = String.fromCharCode(j + 96);
                const id = letter + i;
                const color = ((i + j) % 2 ? COLOR.WHITE : COLOR.BLACK);
                const square = new Square(this, id, color);
                this.squares.push(square);
            })
        );
    }

    initListeners() {
        eventBus.subscribe(EventType.MOVE_PIECE, ({ piece, targetSquare }) => {
            this.tryMove(piece, targetSquare);
            this.updateFenNotation();
        });
    }

    isPlayingWhiteSide() {
        this.currentView === VIEW.white;
    }

    /* increaseBoardSize() {
        IMAGE_SIZE = 90;
        board.style.width = '800px';
        board.style.height = '800px';
        pieces.forEach(p =>
            p.object.style.width = `${IMAGE_SIZE}px`
        );
    } */

    /* flipBoard() {
        this.currentView = isPlayingWhiteSide() ? VIEW.black : VIEW.white;
        drawBoard();
    } */

    drawBoard() {
        let board = document.getElementById("chessboard");
        if (!board) {
            const div = document.createElement("div");
            div.setAttribute("id", "chessboard");
            document.body.appendChild(div);
            board = div;
        }

        let html = '';
        this.squares.forEach(square => html += square.html);
        if (board) {
            board.innerHTML = html;
        } else {
            throw Error("Unable to create the board");
        }
    }

    addPiece(piece: Piece) {
        this.pieces.push(piece);
        const htmlElement = document.createElement('div');
        htmlElement.innerHTML = piece.html;
        const pieceObject = htmlElement.firstChild;
        if (pieceObject) {
            document.body.appendChild(pieceObject);
        }
        piece.addListeners();
        piece.movePiece(piece.squareId);
    }

    createPieces() {
        this.addPiece(new Rook(this, 'a8', COLOR.BLACK));
        this.addPiece(new Knight(this, 'b8', COLOR.BLACK));
        this.addPiece(new Bishop(this, 'c8', COLOR.BLACK));
        this.addPiece(new Queen(this, 'd8', COLOR.BLACK));
        this.addPiece(new King(this, 'e8', COLOR.BLACK));
        this.addPiece(new Bishop(this, 'f8', COLOR.BLACK));
        this.addPiece(new Knight(this, 'g8', COLOR.BLACK));
        this.addPiece(new Rook(this, 'h8', COLOR.BLACK));

        this.addPiece(new Pawn(this, 'a7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'b7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'c7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'd7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'e7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'f7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'g7', COLOR.BLACK));
        this.addPiece(new Pawn(this, 'h7', COLOR.BLACK));

        this.addPiece(new Rook(this, 'a1', COLOR.WHITE));
        this.addPiece(new Knight(this, 'b1', COLOR.WHITE));
        this.addPiece(new Bishop(this, 'c1', COLOR.WHITE));
        this.addPiece(new Queen(this, 'd1', COLOR.WHITE));
        this.addPiece(new King(this, 'e1', COLOR.WHITE));
        this.addPiece(new Bishop(this, 'f1', COLOR.WHITE));
        this.addPiece(new Knight(this, 'g1', COLOR.WHITE));
        this.addPiece(new Rook(this, 'h1', COLOR.WHITE));

        this.addPiece(new Pawn(this, 'a2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'b2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'c2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'd2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'e2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'f2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'g2', COLOR.WHITE));
        this.addPiece(new Pawn(this, 'h2', COLOR.WHITE));
    }

    neighbour(i: number, j: number, dx: number, dy: number) {
        const newI = i + dx;
        const newJ = j + dy;
        if ((newI < 0 || newI > 7) || (newJ < 0 || newJ > 7)) {
            return undefined;
        }
        return this.getSquare(`${String.fromCharCode(newI + 97)}${8 - newJ}`);
    }

    get(i: number, j: number) {
        if ((i < 0 || i > 7) || (j < 0 || j > 7)) {
            return undefined;
        }
        return this.getSquare(`${String.fromCharCode(i + 97)}${8 - j}`);
    }

    changeTurn() {
        this.turn = (this.turn === COLOR.BLACK ? COLOR.WHITE : COLOR.BLACK);
    }

    tryMove(piece: Piece, targetSquare: Square) {
        if (this.moveIsPossible(piece, targetSquare)) {
            this.moveOrEatPiece(piece, targetSquare);
            this.verifyCheckmate();
        } else {
            piece.movePiece(piece.squareId);
        }
    }

    getAllAttackedSquares(color: COLOR) {
        return this.pieces
            .filter(p => p.color === color)
            .reduce((acc: Square[], piece) => [...acc, ...piece.getAttackingSquares()], []);
    }

    getAllProtectedSquares(color: COLOR) {
        return this.pieces
            .filter(p => p.color === color)
            .reduce((acc: Square[], piece) => [...acc, ...piece.getProtectingSquares()], []);
    }

    getOpponentColor(color: COLOR = this.turn) {
        return (color === COLOR.BLACK ? COLOR.WHITE : COLOR.BLACK);
    }

    moveIsPossible(piece: Piece, targetSquare: Square) {
        const opponentColor = this.getOpponentColor();
        const isMyTurn = () => piece.color === this.turn;
        const isLegalMove = (square: Square) => !(square.piece instanceof King); // not eating the king
        const isKingNotInCheck = (square: Square) => !(piece instanceof King) || (piece instanceof King && !this.getAllAttackedSquares(opponentColor).some(s => s.id === square.id));
        const isKingNotEatingProtectedPiece = (square: Square) => !(piece instanceof King) || (piece instanceof King && !this.getAllProtectedSquares(opponentColor).some(s => s.id === square.id));

        const moveHasNoCheck = () => {
            const newBoard = this.simulateMove(piece, targetSquare);
            return !newBoard.isInCheck(piece.color);
        }

        const possibleMoves = piece.getPossibleMoves();
        return !this.isCheckmate &&
            isMyTurn() &&
            possibleMoves
                .filter(isLegalMove)
                .filter(isKingNotInCheck)
                .filter(isKingNotEatingProtectedPiece)
                .some(square => square.id === targetSquare.id)
            &&
            moveHasNoCheck();
    }

    moveOrEatPiece(piece: Piece, square: Square) {
        if (square.piece) {
            square.piece.remove();
        }
        piece.movePiece(square.id);
        this.changeTurn();
    }

    // TODO : brut force..
    getClosestSquare(x: number, y: number) {

        let mindistance: { square: Square | null, distance: number } = { square: null, distance: Infinity };

        this.squares.forEach(s => {

            const coords = getHtmlElementCoords(s.object);

            if (coords) {
                const { left, top } = coords;
                const distance = Math.hypot(left - x, top - y);
                if (distance < mindistance.distance) {
                    mindistance = { square: s, distance };
                }
            }
        });

        return mindistance.square;
    }

    getSquare(squareId: string) {
        const square = this.squares.find(s => s.id === squareId);
        if (!square) {
            throw new Error("Square not found " + squareId);
        }
        return square;
    }

    isInCheck(color: COLOR = this.turn): boolean {
        const opponentColor = this.getOpponentColor(color);

        const king = this.pieces.find(p => p instanceof King && p.color === color);
        if (king) {
            const kingSquare = this.getSquare(king.squareId);
            return this.getAllAttackedSquares(opponentColor).some(s => s.id === kingSquare.id);
        }
        return false;
    }

    verifyCheckmate(color: COLOR = this.turn): boolean {
        const allPieces = this.pieces.filter(p => p.color === color);
        const anyPossibleMove = allPieces.some(p =>
            p.getPossibleMoves().some(square => {
                const newBoard = this.simulateMove(p, square);
                return !newBoard.isInCheck(color);
            })
        );

        this.isCheckmate = !anyPossibleMove;
        if (this.isCheckmate) {
            this.gameOver();
        }
        return this.isCheckmate;
    }

    simulateMove(piece: Piece, targetSquare: Square) {
        const newBoard = this.clone();
        const thePiece = newBoard.pieces.find(p => p.originalId === piece.id);
        const theSquare = newBoard.squares.find(s => s.id === targetSquare.id);
        if (thePiece && theSquare) {
            newBoard.moveOrEatPiece(thePiece, theSquare);
        }
        return newBoard;
    }

    gameOver() {
        let board = document.getElementById("chessboard");
        if (board) {
            board.setAttribute("class", "game-over");
        }
    }

    clone() {
        const newChessboard = new Chessboard(this.currentView);
        newChessboard.pieces = this.pieces.map(copyInstance);
        newChessboard.pieces.forEach(piece => {
            piece.id += 100; // TODO moche
            piece.board = newChessboard;
        });
        newChessboard.squares = this.squares.map(copyInstance);
        newChessboard.squares.forEach(square => square.board = newChessboard);
        newChessboard.turn = this.turn;
        return newChessboard;
    }

    getFenNotation() {
        let fen = "";
        let i = 0;
        this.squares.map(square => {
            fen += square.getFenNotation();
            i++;
            if (i > 7) {
                i = 0;
                fen += "/";
            }
        });

        let board = fen.split("/").map(
            line =>
                //console.log(line.match(/(\*)+/))
                line.replace(/([a-z]*)(\*+)([a-z]*)/gi, (match, p1, p2, p3, offset, s) =>
                    //console.log("match " + [p1, p2.split("").length, p3].join(' - '))
                    [p1, p2.split("").length, p3].join('')
                )
        ).join('/');
        const activeColor = () => this.turn === COLOR.WHITE ? "w" : "b";
        const castlingStatus = () => "-";
        const enPassantTargetSquare = () => "-";
        const halfmoveClock = () => 0;
        const fullmoveNumber = () => 0;
        return `${board} ${activeColor()} ${castlingStatus()} ${enPassantTargetSquare()} ${halfmoveClock()} ${fullmoveNumber()}`
    }

    updateFenNotation() {
        const fenInput = document.getElementById("fen");
        if (fenInput) {
            (<HTMLInputElement>fenInput).value = this.getFenNotation();
        }
    }
}

export class Square {

    constructor(public board: Chessboard, public id: string, public color: COLOR) {
    }

    get html() {
        return `<div id="${this.id}" class="square disable-select ${COLOR[this.color].toLowerCase()}"></div>`;
    }

    get piece() {
        return this.board.pieces.find(p => this.id === p.squareId);
    }

    get object(): HTMLElement | null {
        return document.getElementById(this.id);
    }

    getFenNotation() {
        return this.piece ? (this.piece.color === COLOR.WHITE ? this.piece.name.fenNotationWhite : this.piece.name.fenNotationBlack) : "*";
    }
}
