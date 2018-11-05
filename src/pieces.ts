import { COLOR, Square, Chessboard } from './board';
import { getHtmlElementCoords } from "./lib";
import { eventBus, EventType } from './EventBus';

interface PieceType {
    name: string;
    className: string;
    notation: string;
    fenNotationWhite: string;
    fenNotationBlack: string;
    iconWhite: string;
    iconBlack: string;
}

const PIECE = {
    PAWN: { name: "Pawn", className: 'Pawn', notation: "", fenNotationWhite: "P", fenNotationBlack: "p", iconWhite: "wp", iconBlack: "bp" },
    ROOK: { name: "Rook", className: 'Rook', notation: "R", fenNotationWhite: "R", fenNotationBlack: "r", iconWhite: "wr", iconBlack: "br" },
    KNIGHT: { name: "Knight", className: 'Knight', notation: "N", fenNotationWhite: "N", fenNotationBlack: "n", iconWhite: "wn", iconBlack: "bn" },
    BISHOP: { name: "Bishop", className: 'Bishop', notation: "B", fenNotationWhite: "B", fenNotationBlack: "b", iconWhite: "wb", iconBlack: "bb" },
    QUEEN: { name: "Queen", className: 'Queen', notation: "Q", fenNotationWhite: "Q", fenNotationBlack: "q", iconWhite: "wq", iconBlack: "bq" },
    KING: { name: "King", className: 'King', notation: "K", fenNotationWhite: "K", fenNotationBlack: "k", iconWhite: "wk", iconBlack: "bk" },
}

const PIECE_IMG_URL = (name: string) => `http://images.chesscomfiles.com/chess-themes/pieces/neo/90/${name}.png`;
const IMAGE_SIZE = 90;
let PIECE_ID = 1;
let currentPiece: Piece | undefined;

export class Piece {
    public id: number;
    public readonly originalId: number;

    constructor(public board: Chessboard, public squareId: string, public name: PieceType, public color: COLOR) {
        this.id = PIECE_ID++; // TODO moche
        this.originalId = this.id;
    }

    // move the piece at (pageX, pageY) coordinates
    moveAt(pageX: number, pageY: number) {
        if (this.object) {
            this.object.style.left = pageX - this.object.offsetWidth / 2 + 'px';
            this.object.style.top = pageY - this.object.offsetHeight / 2 + 'px';
        }
    }

    movePiece(squareId: string) {
        const square = this.board.getSquare(squareId);
        if (square) {

            const coords = getHtmlElementCoords(square.object);
            if (this.object && coords) {
                //console.log('move piece', squareId, new Error().stack)
                this.object.style.top = coords.top + 'px';
                this.object.style.left = coords.left + 'px';
                //const x = +coords.left - 0//((coords.width-IMAGE_SIZE)/2);
                //const y = +coords.top - 0//((coords.height-IMAGE_SIZE)/2);
                //piece.object.style.transform = `translate(${x}px,${y}px)`;
                //logMove(piece, squareId);
            }
            this.squareId = squareId;
        }
    }

    get html() {
        const icon = this.color == COLOR.WHITE ? this.name.iconWhite : this.name.iconBlack
        return `<img id="${this.id}" 
        class="piece" 
        draggable="false" 
        src="${PIECE_IMG_URL(icon)}" 
        width="${IMAGE_SIZE}">`;
    }

    get object() {
        return document.getElementById(this.id.toString());
    }

    get i() {
        return +(this.squareId.substring(0, 1).charCodeAt(0)) - 97;
    }

    get j() {
        return 8 - (+this.squareId.substring(1));
    }

    remove() {
        this.board.pieces = this.board.pieces.filter(p => p !== this);

        const pieceElement = this.object;
        if (pieceElement) {
            pieceElement.parentNode && pieceElement.parentNode.removeChild(pieceElement);
        }
    }

    getPossibleMoves(): Array<Square> {
        return [];
    }

    getAttackingSquares(): Array<Square> {
        return [];
    }

    getProtectingSquares(): Array<Square> {
        return [];
    }

    getPieceFromHtmlObject(htmlObject: Element) {
        const pieceId = htmlObject.getAttribute('id');
        if (pieceId) {
            return this.board.pieces.find(p => p.id === +pieceId);
        }
        return undefined;
    }

    addListeners() {
        const element = this.object;
        if (element) {
            element.addEventListener('mousedown', event => this.onGrabbed(event));
        }
    }

    onGrabbed(event: MouseEvent) {
        if (event.target) {

            currentPiece = this.getPieceFromHtmlObject(event.toElement);

            if (currentPiece) {
                currentPiece.moveAt(event.pageX, event.pageY);
                document.addEventListener('mousemove', Piece.onMoved);
                document.addEventListener('mouseup', event => this.onReleased(event));
            }
        }
    }

    static onMoved(event: MouseEvent) {
        if (currentPiece) {
            currentPiece.moveAt(event.pageX, event.pageY);
        }
    }

    onReleased(event: MouseEvent) {
        document.removeEventListener('mousemove', Piece.onMoved);

        if (currentPiece) {
            const element = currentPiece.object;
            if (element) {
                const targetSquare = this.board.getClosestSquare(
                    event.pageX - element.offsetWidth / 2,
                    event.pageY - element.offsetHeight / 2);

                eventBus.publish(EventType.MOVE_PIECE, { piece: currentPiece, targetSquare });

                currentPiece = undefined;
            }
        }
    }
}

export class Pawn extends Piece {
    constructor(board: Chessboard, squareId: string, color: COLOR) {
        super(board, squareId, PIECE.PAWN, color);
    }
    getPossibleMoves() {
        let moves = [];
        let dj = this.color == COLOR.BLACK ? 1 : -1;
        let ahead = this.board.neighbour(this.i, this.j, 0, dj);
        if (ahead && !ahead.piece) {
            moves.push(ahead);
        }

        if (this.isAtInitialSquare()) {
            let aheadTwice = this.board.neighbour(this.i, this.j, 0, dj * 2);
            if (aheadTwice && !aheadTwice.piece) {
                moves.push(aheadTwice);
            }
        }

        let aheadLeft = this.board.neighbour(this.i, this.j, -1, dj);
        if (aheadLeft && aheadLeft.piece && aheadLeft.piece.color !== this.color) {
            moves.push(aheadLeft);
        }

        let aheadRight = this.board.neighbour(this.i, this.j, 1, dj)
        if (aheadRight && aheadRight.piece && aheadRight.piece.color !== this.color) {
            moves.push(aheadRight);
        }

        return moves;
    }

    getAttackingSquares() {
        const squares = [];
        let dj = this.color == COLOR.BLACK ? 1 : -1;
        let aheadLeft = this.board.neighbour(this.i, this.j, -1, dj);
        if (aheadLeft) {
            squares.push(aheadLeft);
        }
        let aheadRight = this.board.neighbour(this.i, this.j, 1, dj);
        if (aheadRight) {
            squares.push(aheadRight);
        }
        return squares;
    }

    getProtectingSquares() {
        return this.getAttackingSquares();
    }

    getSymbol() {
        return this.color == COLOR.BLACK ? "&#9823;" : "&#9817;";
    }
    isAtInitialSquare() {
        return this.color == COLOR.WHITE ? (this.j === 6) : (this.j === 1);
    }
}

export class Knight extends Piece {
    constructor(board: Chessboard, squareId: string, color: COLOR) {
        super(board, squareId, PIECE.KNIGHT, color);
    }

    getPossibleMoves() {
        const moves: Square[] = [];
        const predicate = (square: Square) => !square.piece || (square.piece && square.piece.color != this.color);

        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, -1, -2));
        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, -1, 2));

        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, -2, -1));
        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, -2, 1));

        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, 1, -2));
        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, 1, 2));

        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, 2, -1));
        this.addMove(moves, predicate, this.board.neighbour(this.i, this.j, 2, 1));

        return moves;
    }
    addMove(moves: Square[], predicate: (square: Square) => boolean, square?: Square) {
        if (square && predicate(square)) {
            moves.push(square);
        }
    }

    getAttackingSquares() {
        return this.getPossibleMoves();
    }

    getProtectingSquares() {
        return this.getAttackingSquares();
    }

    getSymbol() {
        return this.color != COLOR.BLACK ? "&#9816;" : "&#9822;";
    }
}

export class Rook extends Piece {
    constructor(board: Chessboard, squareId: string, color: COLOR) {
        super(board, squareId, PIECE.ROOK, color);
    }

    scanMoves(predicate: (square: Square) => boolean, stopper: (square: Square) => boolean) {
        const moves: Square[] = [];

        for (let i = this.i - 1, square = this.board.get(i, this.j);
            i >= 0 && square && predicate(square);
            square = this.board.get(--i, this.j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        for (let i = this.i + 1, square = this.board.get(i, this.j);
            i < 8 && square && predicate(square);
            square = this.board.get(++i, this.j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        for (let j = this.j - 1, square = this.board.get(this.i, j);
            j >= 0 && square && predicate(square);
            square = this.board.get(this.i, --j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        for (let j = this.j + 1, square = this.board.get(this.i, j);
            j < 8 && square && predicate(square);
            square = this.board.get(this.i, ++j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        return moves;
    }

    getPossibleMoves() {
        const predicate = (square: Square) => !square.piece || (square.piece && square.piece.color !== this.color);
        const stopper = (square: Square) => (square.piece && square.piece.color !== this.color) || false;
        return this.scanMoves(predicate, stopper);
    }

    getAttackingSquares() {
        return this.getPossibleMoves();
    }

    getProtectingSquares() {
        const predicate = (square: Square) => !square.piece || (square.piece && square.piece.color === this.color);
        const stopper = (square: Square) => (square.piece && square.piece.color === this.color) || false;
        return this.scanMoves(predicate, stopper);
    }

    getSymbol() {
        return (this.color == COLOR.BLACK) ? "&#9820;" : "&#9814;";
    }
}

export class Bishop extends Piece {
    constructor(board: Chessboard, squareId: string, color: COLOR) {
        super(board, squareId, PIECE.BISHOP, color);
    }

    getSymbol() {
        return (this.color == COLOR.BLACK) ? "&#9821;" : "&#9815;";
    }

    scanMoves(predicate: (square: Square) => boolean, stopper: (square: Square) => boolean) {
        const moves: Square[] = [];

        for (let i = this.i + 1, j = this.j + 1, square = this.board.get(i, j);
            i < 8 && j < 8 && square && predicate(square);
            i++ , j++ , square = this.board.get(i, j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        for (let i = this.i - 1, j = this.j + 1, square = this.board.get(i, j);
            i >= 0 && j < 8 && square && predicate(square);
            i-- , j++ , square = this.board.get(i, j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        for (let i = this.i + 1, j = this.j - 1, square = this.board.get(i, j);
            i < 8 && j >= 0 && square && predicate(square);
            i++ , j-- , square = this.board.get(i, j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }

        for (let i = this.i - 1, j = this.j - 1, square = this.board.get(i, j);
            i >= 0 && j >= 0 && square && predicate(square);
            i-- , j-- , square = this.board.get(i, j)) {
            moves.push(square);
            if (stopper(square)) {
                break;
            }
        }
        return moves;
    }

    getPossibleMoves() {
        const predicate = (square: Square) => !square.piece || (square.piece && square.piece.color !== this.color);
        const stopper = (square: Square) => (square.piece && square.piece.color !== this.color) || false;

        return this.scanMoves(predicate, stopper);
    }

    getAttackingSquares() {
        return this.getPossibleMoves();
    }

    getProtectingSquares() {
        const predicate = (square: Square) => !square.piece || (square.piece && square.piece.color === this.color);
        const stopper = (square: Square) => (square.piece && square.piece.color === this.color) || false;

        return this.scanMoves(predicate, stopper);
    }

}

export class Queen extends Piece {
    constructor(board: Chessboard, squareId: string, color: COLOR) {
        super(board, squareId, PIECE.QUEEN, color);
    }

    getSymbol() {
        return (this.color == COLOR.BLACK) ? "&#9819;" : "&#9813;";
    }

    getPossibleMoves() {
        const bishop = new Bishop(this.board, this.squareId, this.color);
        const rook = new Rook(this.board, this.squareId, this.color);
        return bishop.getPossibleMoves().concat(rook.getPossibleMoves());
    }

    getAttackingSquares() {
        return this.getPossibleMoves();
    }

    getProtectingSquares() {
        const bishop = new Bishop(this.board, this.squareId, this.color);
        const rook = new Rook(this.board, this.squareId, this.color);
        return bishop.getProtectingSquares().concat(rook.getProtectingSquares());
    }

}

export class King extends Piece {
    constructor(board: Chessboard, squareId: string, color: COLOR) {
        super(board, squareId, PIECE.KING, color);
    }

    getSymbol() {
        return (this.color == COLOR.BLACK) ? "&#9818;" : "&#9812;";
    }

    getPossibleMoves() {
        const moves: Square[] = [];
        const predicate = (square: Square) => (square && !square.piece) || (square && square.piece && square.piece.color != this.color)
        let directions = [
            { di: 0, dj: -1 }, { di: 0, dj: 1 },
            { di: 1, dj: 1 }, { di: 1, dj: 0 }, { di: 1, dj: -1 },
            { di: -1, dj: 1 }, { di: -1, dj: 0 }, { di: -1, dj: -1 },
        ]
        const me = this
        directions.forEach(d => {
            const { di, dj } = d;
            const square = this.board.neighbour(me.i, me.j, di, dj)
            if (square && predicate(square)) {
                moves.push(square);
            }
        })
        return moves;
    }

    getAttackingSquares() {
        return this.getPossibleMoves();
    }

    getProtectingSquares() {
        return this.getAttackingSquares();
    }

}