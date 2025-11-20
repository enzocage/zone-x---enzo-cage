export class Particle {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.life = 1.0;
        this.type = type;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (type === 'explode' ? 4 : type === 'grass' ? 2 : 1);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.decay = type === 'grass' ? 0.05 : 0.02;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        if (this.type === 'grass') { ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, 3, 3); }
        else if (this.type === 'sparkle') { ctx.fillStyle = '#fff'; ctx.fillRect(this.x, this.y, 2, 2); }
        else if (this.type === 'explode') { ctx.fillStyle = `hsl(${Math.random() * 60}, 100%, 50%)`; ctx.fillRect(this.x, this.y, 4, 4); }
        else if (this.type === 'trail') { ctx.fillStyle = 'rgba(0,255,255,0.3)'; ctx.fillRect(this.x, this.y, 30, 30); }
        ctx.globalAlpha = 1;
    }
}
