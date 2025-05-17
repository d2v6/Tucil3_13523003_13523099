export class PrioQueue<T> {
    private items: T[] = [];
    private comparator: (a: T, b: T) => number;

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator;
    }

    private bubbleUp(idx: number): void {
        while (idx > 0) {
            const parent = Math.floor((idx - 1) / 2);
            if (this.comparator(this.items[idx], this.items[parent]) >= 0) {
                break;
            }
            [this.items[parent], this.items[idx]] = [this.items[idx], this.items[parent]];
            idx = parent;
        }
    }

    private bubbleDown(idx: number): void {
        const len = this.items.length;
        while (true) {
            let left = 2 * idx + 1;
            let right = 2 * idx + 2;
            let smallest = idx;

            if (left < len && this.comparator(this.items[left], this.items[smallest]) < 0) {
                smallest = left;
            }

            if (right < len && this.comparator(this.items[right], this.items[smallest]) < 0) {
                smallest = right;
            }

            if (smallest == idx) {
                break;
            }

            [this.items[idx], this.items[smallest]] = [this.items[smallest], this.items[idx]];
            idx = smallest;
        }
    }

    size(): number {
        return this.items.length;
    }

    isEmpty(): boolean {
        return !this.size();
    }

    push(item: T): void {
        this.items.push(item);
        this.bubbleUp(this.items.length - 1);
    }

    pop(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        const top = this.items[0];
        const last = this.items.pop()!
        if (this.items.length > 0) {
            this.items[0] = last;
            this.bubbleDown(0);
        }
        return top;
    }
}