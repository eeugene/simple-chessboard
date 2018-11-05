export const reverse = (table: any[]): any[] => {
    const rec = (t1: any[], t2: any[]): any[] => {
        if (t2.length) {
            const last = t2.pop();
            return rec([...t1, last], t2);
        }
        return t1;
    }
    return rec([], [...table]);
};

export const getHtmlElementCoords = (elem: HTMLElement | null) => {
    if (elem === null) {
        return null;
    }
    const box = elem.getBoundingClientRect();
    const coords = {
        top: box.top + pageYOffset,
        left: box.left + pageXOffset,
        width: box.width,
        height: box.height
    };
    return coords;
};

export const copyInstance = (original:any) => {
    var copied = Object.assign(
        Object.create(
            Object.getPrototypeOf(original)
        ),
        original
    );
    return copied;
}