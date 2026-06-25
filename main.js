const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },

    scene: {
        preload,
        create,
        update
    }
};

new Phaser.Game(config);

const colors = [
    0xff0000,
    0xff7f00,
    0xffff00,
    0x00ff00,
    0x0000ff,
    0x4b0082,
    0x9400d3
];

function preload() {
    this.load.image("bg", "assets/bg.png");
    this.load.image("mainGround", "assets/tiles/ground.png");
    this.load.image("platform", "assets/tiles/platform.png");
    this.load.spritesheet("player", "assets/player.png", {
        frameWidth: 540,
        frameHeight: 540
    });
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
}

function create() {
    //score
    this.score = 0;
    this.gameOver = false;
    this.lastScaleMilestone = 0;
    this.colorIndex = 0;

    this.add.image(400, 300, "bg").setDisplaySize(800, 600);

    //Platform
    this.ground = this.physics.add.staticGroup();
    const base = this.ground.create(400, 580, "mainGround");
    base.setScale(800 / base.width, 100 / base.height);
    base.refreshBody();
    base.body.setSize(base.displayWidth, 30);
    base.body.setOffset(0, base.displayHeight - 80);

    //create platforms
    this.platforms = this.physics.add.staticGroup();
    
    const platformPositions = [
        { x: 150, y: 450 },
        { x: 440, y: 380 },
        { x: 400, y: 280 },
        { x: 750, y: 410 },
        { x: 90, y: 310 },
        { x: 650, y: 175 },
        { x: 350, y: 100 },
        { x: 250, y: 180 }
    ];

    platformPositions.forEach(pos => {
        const p = this.platforms.create(pos.x, pos.y, "platform");
        p.setScale(0.5);
        p.refreshBody();
        p.body.setSize(p.displayWidth, 20);
        p.body.setOffset(0, p.displayHeight - 20);
    });

    //Player - has a physics body, so gravity pulls it down
    this.player = this.physics.add.sprite(100, 400, "player");
    this.player.setScale(0.1);
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(180, 425);
    this.player.setOffset(180, 180);

    //collider - stops the player falling through the platform
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms);

    //controls
    this.cursors = this.input.keyboard.createCursorKeys();

    //animations
    this.anims.create({
        key: "idle",
        frames: [{ key: "player", frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    this.anims.create({
        key: "walk",
        frames: [
            { key: "player", frame: 2 },
            { key: "player", frame: 3 }
        ],
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: "jump",
        frames: [{ key: "player", frame: 1 }],
        frameRate: 1
    });

    this.player.play("idle");

    this.stars = this.physics.add.group();

    this.collectStar = (player, star) => {
        star.destroy();
        this.score++;
        this.scoreText.setText("Stars Collected: " + this.score);
        
        //open F12 to see this
        console.log("Score: ", this.score);

        player.setTint(colors[this.colorIndex]);
        this.colorIndex = (this.colorIndex + 1) % colors.length;

        if (Math.floor(this.score / 5) > this.lastScaleMilestone) {
            this.lastScaleMilestone++;
            player.setScale(player.scaleX * 1.1);
        }

        //spawn new star
        const x = Phaser.Math.Between(50, 750);
        const newStar = this.stars.create(x, 0, "star");
        newStar.setScale(0.5);
        newStar.setCircle(newStar.width / 2);
        newStar.setBounce(0);
        newStar.setCollideWorldBounds(true);

        //spawn bomb
        const bombX = player.x < 400 ? Phaser.Math.Between(420, 780) : Phaser.Math.Between(20, 380);
        const bomb = this.bombs.create(bombX, 0, "bomb");
        bomb.body.setOffset(0, 70);
        bomb.setScale(0.3);
        bomb.setCircle(bomb.displayWidth / 2);
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-220, 220), 20);
    };

    this.hitBomb = (player, bomb) => {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.stop();
        this.gameOver = true;

        this.add.text(260, 200, "GAME OVER", {
            fontSize: "48px",
            fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
            color: "#7f0000",
            fontStyle: "bold"
        });
        
        console.log("Game Over! Final score: " + this.score);
    };

    //spawn initial stars
    for (let i = 0; i < 1; i++) {
        const x = Phaser.Math.Between(50, 750);
        const star = this.stars.create(x, 0, "star");
        star.setScale(0.5);
        star.setCircle(star.width / 2);
        star.setBounce(0);
        star.setCollideWorldBounds(true);
    }

    //Stretch goal: second platform at different height with extra stars
    const upperStar2 = this.stars.create(250, 150, "star");
    upperStar2.setScale(0.5);
    upperStar2.setCircle(upperStar2.width / 2);
    
    const upperStar3 = this.stars.create(650, 120, "star");
    upperStar3.setScale(0.5);
    upperStar3.setCircle(upperStar3.width / 2);

    //collisions for stars
    this.physics.add.collider(this.stars, this.ground);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

    //bomb group
    this.bombs = this.physics.add.group();

    //collisions for bombs
    this.physics.add.collider(this.bombs, this.ground);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

    //score text
    this.scoreText = this.add.text(520, 20, "Stars Collected: 0", {
        fontSize: "28px",
        fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
        color: "#ffffff",
        fontStyle: "bold"
    });
}

function update() {
    if (this.gameOver) return;

    let speed = 250;
    let moving = false;

    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);
        moving = true;
    }
    else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);
        moving = true;
    }
    else {
        this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body.blocked.down) {
        this.player.setVelocityY(-520);
    }

    if (!this.player.body.blocked.down) {
        this.player.play("jump", true);
    }
    else if (moving) {
        this.player.play("walk", true);
    }
    else {
        this.player.play("idle", true);
    }
}