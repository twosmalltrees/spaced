/// Global variables ///

var spawnEnemiesInterval;

///////// ------------ THE ROCKET SHIP ------------ ////////

Rocket = {
  velocity: 0,
  direction: 0,
  position: [700, 0],
  image: $("<img class='rocket' src='images/rocket.png'><img class='rocketFlame' src='images/rocketFlame.png'>"),
  fireEngines: function() {
    // Run on up button keydown.
    console.log(this.velocity);
    if (this.velocity <= 12) {
      this.velocity += 0.5;
      $('.rocketFlame').css({
        'transform': 'scaleY(4) translateY(5px)'
      });
    }
  },

  steer: function(rotation) {
    if (rotation === 'clockwise') {
      this.direction += 3;
      $('.rocketDiv').css({
        'transform': 'rotate(' + this.direction + 'deg)'
      });
    } else if (rotation === 'counterClockwise') {
      this.direction -= 3;
      $('.rocketDiv').css({
        'transform': 'rotate(' + this.direction + 'deg)'
      });
    }
  },

  airResistance: function() {
    // Run on keyup, and while velocity is greater than 0.
    if (Rocket.velocity > 0.15) {
      Rocket.velocity = Rocket.velocity - 0.1;
    } else if (Rocket.velocity < 0.15 && Rocket.velocity > 0) {
      Rocket.velocity = 0;
    }
  },

  fireLasers: function() {
    var laser = Guns.bulletFactory("laser");
    $('body').append(laser.image);
    return laser;
  }
};


///////// ------------ THE ENEMIES ------------ ////////

Enemy = {
  // Creates a new enemy
  enemyFactory: function() {
    var enemy = {
      position: [],
      velocity: 1,
      direction: 0,
    };

    // Assign image based on randomly generated enemy type
    var enemyRandomiser = World.getRandom();

    if (enemyRandomiser < 0.5) {
      enemy.enemyType = "nought";
      enemy.image = $("<div class='enemy nought'><i class='fa fa-circle-o'></i></div>");
    } else {
      enemy.enemyType = "cross";
      enemy.image = $("<div class='enemy cross'><i class='fa fa-times'></i></i></div>");
    }

    // Logic to work out random spawn locations
    var sideRandomiser = World.getRandom();
    var positionRandomiser = World.getRandom();
    var directionRandomiser = World.getRandom();

    // Chooses where to place enemy
    if (sideRandomiser > 0.75) {
      // Case One - Spawns from top
      enemy.position = [($('body').width() * positionRandomiser), 0];
      enemy.direction = (90 * directionRandomiser);
    } else if (sideRandomiser > 0.5) {
      // Case Two - Spawns from right
      enemy.position = [$('body').width(), ($('body').height() * positionRandomiser)];
      enemy.direction = (180 + (180 * directionRandomiser));
    } else if (sideRandomiser > 0.25) {
      // Case Three - Spawns from bottom
      enemy.position = [($('body').width() * positionRandomiser), $('body').height()];
      enemy.direction = (270 + (180 * directionRandomiser));
    } else {
      // Case Four - Spawns from left
      enemy.position = [0, ($('body').height() * positionRandomiser)];
      enemy.direction = (180 * directionRandomiser);
    }
    // Attach position to the CSS
    enemy.image.css({
      'left': enemy.position[0] + "px",
      'top': enemy.position[1] + "px",
    });
    // Append the enemy to the DOM
    $('body').append(enemy.image);
    return enemy;
  },
  explode: function(enemy) {
    enemy.image.html("<img class='explosion' src='images/explosion.png'>");
    enemy.image.css({
      'transform': 'scale(1.5,1.5)'
    });
    setTimeout(function() {
      enemy.image.css({
        'opacity': '0'
      });
    }, 250);
  }
};

///////// ----------------- GUNS ----------------- ////////

Guns = {
  bulletFactory: function(type) {
    // Creates a new bullet
    var bullet = {
      position: [Rocket.position[0] + 19, Rocket.position[1] + 40],
      velocity: Rocket.velocity,
      direction: Rocket.direction,
      lifetime: 0,
      bulletType: type,
      image: $("<div class='bullet " + type + "'></div>")
    };
    // Set speed relative to spaceship based on type of bullet
    if (bullet.bulletType === "laser") {
      bullet.velocity += 10;
    }
    // Set starting position of bullet at spaceships location
    bullet.image.css({
      'left': bullet.position[0] + "px",
      'bottom': bullet.position[1] + "px",
      'transform': 'rotate(' + bullet.direction + 'deg)'
    });
    return bullet;
  }
};

///////// ----------------- WORLD ----------------- ////////

World = {
  // Stores a collection of all the enemies.
  enemies: [],
  // Stores a collection of bullets.
  projectiles: [],
  // Stores the current score.
  score: 0,
  // Sets up an interval to call renderPage every 40ms (25fps);
  start: function() {
    requestAnimationFrame(this.renderPage);
  },
  // Updates the users score on screen.
  updateScore: function() {
    $('.scoreCount').html(World.score);
  },

  renderPage: function() {
    // First, action all user button presses:
    UserInteraction.actionUserInput();

    // DETECT COLLISIONS - loop through World.projectiles and World.enemies and check collisions.
    // Thanks to MDN for this collision detection algorithm.
    for (var k = 0; k < World.enemies.length; k++) {
      for (var m = 0; m < World.projectiles.length; m++) {
        var thisEnemy = World.enemies[k];
        var enemyXPos = thisEnemy.image.offset().left;
        var enemyYPos = thisEnemy.image.offset().top;
        var thisBullet = World.projectiles[m];
        var bulletXPos = thisBullet.image.offset().left;
        var bulletYPos = thisBullet.image.offset().top;
        var bulletRadius = 5;
        var enemyRadius = 12.5;

        var dx = enemyXPos - bulletXPos;
        var dy = enemyYPos - bulletYPos;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bulletRadius + enemyRadius) {
          Enemy.explode(World.enemies[k]);
          thisBullet.image.css({
            'display': 'none'
          });
          World.enemies.splice(k, 1);
          World.projectiles.splice(m, 1);
          World.score += 1;
          World.updateScore();
        }
      }
    }

    // ROCKET - checks and update the position of the rocket
    var rocket_image_div = Rocket.image;
    var velocity_components = World.breakDownVelocity(Rocket.velocity, Rocket.direction);
    Rocket.position[0] += velocity_components[0];
    Rocket.position[1] += velocity_components[1];
    $('.rocketDiv').css({
      'left': Rocket.position[0] + 'px',
      'bottom': Rocket.position[1] + 'px'
    });

    // BULLETS - check and update the position of all World.projectiles
    for (var i = 0; i < World.projectiles.length; i++) {
      var bullet = World.projectiles[i];
      var bullet_div = bullet.image;
      velocity_components = World.breakDownVelocity(bullet.velocity, bullet.direction);
      bullet.position[0] += velocity_components[0];
      bullet.position[1] += velocity_components[1];

      // Checks bullet lifetime. If it has existed for longer than 150 iterations, it is spliced from the World.projectiles array so as to not track bullets flying miles off screen.
      if (bullet.lifetime < 150) {
        bullet.lifetime++;
      } else {
        World.projectiles.splice(i, 1);
        bullet.image.css({
          'display': 'none'
        });
      }
      // Update posiiton of the bullet on screen.
      bullet.image.css({
        'left': bullet.position[0] + 'px',
        'bottom': bullet.position[1] + 'px'
      });
    }

    // ENEMIES - check and update the position of all World.projectiles
    for (var j = 0; j < World.enemies.length; j++) {
      var enemy = World.enemies[j];
      var enemy_div = enemy.image;
      velocity_components = World.breakDownVelocity(enemy.velocity, enemy.direction);
      enemy.position[0] += velocity_components[0];
      enemy.position[1] += velocity_components[1];
      enemy.image.css({
        'left': enemy.position[0] + 'px',
        'top': enemy.position[1] + 'px'
      });
      // Stop tracking enemies if they stray outside the screen
      if (enemy.position[0] < -50 || enemy.position[0] > $(window).width() + 50 || enemy.position[1] < -50 || enemy.position[1] > $(window).height + 50) {
        World.enemies.splice(j, 1);
      }
    }
    window.requestAnimationFrame(World.renderPage);
  },

  breakDownVelocity: function(velocity, direction) {
    var angleFromHorizontal;
    var xComponent;
    if (direction >= 0 && direction <= 90) {
      angleFromHorizontal = this.toRadians(90 - direction); // Converts to radians for input to sin/cos
      xComponent = velocity * Math.cos(angleFromHorizontal);
      yComponent = velocity * Math.sin(angleFromHorizontal);
      return [xComponent, yComponent];
    } else if (direction > 90 && direction <= 180) {
      angleFromHorizontal = this.toRadians(direction - 90);
      xComponent = velocity * Math.cos(angleFromHorizontal);
      yComponent = velocity * Math.sin(angleFromHorizontal) * -1;
      return [xComponent, yComponent];
    } else if (direction > 180 && direction <= 270) {
      angleFromHorizontal = this.toRadians(270 - direction);
      xComponent = velocity * Math.cos(angleFromHorizontal) * -1;
      yComponent = velocity * Math.sin(angleFromHorizontal) * -1;
      return [xComponent, yComponent];
    } else {
      angleFromHorizontal = this.toRadians(direction - 270);
      xComponent = velocity * Math.cos(angleFromHorizontal) * -1;
      yComponent = velocity * Math.sin(angleFromHorizontal);
      return [xComponent, yComponent];
    }
  },
  toRadians: function(angle) {
    return angle * (Math.PI / 180);
  },

  getRandom: function() {
    return Math.random();
  },
};

// Controls all the user input, key listeners logic etc
var UserInteraction = {
  keysPressed: [],
  addKeyboardListeners: function() {
    // When key is pressed, sets it's value in array to true.
    $(window).on("keydown", function(event) {
      UserInteraction.keysPressed[event.keyCode] = true;
    });
    // When released, value is set back to false.
    $(window).on("keyup", function(event) {
      UserInteraction.keysPressed[event.keyCode] = false;
    });
  },
  actionUserInput: function() {
    // Fire Engines, stop air resistance function.
    if (UserInteraction.keysPressed[38]) {
      Rocket.fireEngines();
    }
    // Counter clockwise turn on left button press
    if (UserInteraction.keysPressed[37]) {
      Rocket.steer('counterClockwise');
    }
    //Clockwise turn on right button press
    if (UserInteraction.keysPressed[39]) {
      Rocket.steer('clockwise');
    }
    // Fire Laser!
    if (UserInteraction.keysPressed[32]) {
      var bullet = Rocket.fireLasers();
      World.projectiles.push(bullet);
    }
    // Reduce rocket flame size on keyup, and set air resistance interval up again.
    if (UserInteraction.keysPressed[38] === false) {
      Rocket.airResistance();
      console.log("Air resistance was called");
      $('.rocketFlame').css({
        'transform': 'scaleY(1.5) translateY(0px)'
      });
    }
  }
};


$(document).ready(function() {

  UserInteraction.addKeyboardListeners();

  // Sets up spawn enemies interval
  setTimeout(function() {
    setInterval(function() {
      var enemy = Enemy.enemyFactory();
      World.enemies.push(enemy);
    }, 2000);
  }, 1000);

  $('.rocketDiv').append(Rocket.image);


  World.start();

});
