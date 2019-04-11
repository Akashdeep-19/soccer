var team = [];
var ball;
var region = [];
var bot;
var passSpeed = 2;
var shootSpeed = 4;
var blueData = [[860,300,'gk',0],
                 [750,250,'d',300],[750,350,'d',300],[750,100,'d',200],[750,500,'d',200],
                 [600,300,'m',150],[600,100,'m',30],[600,500,'m',30],
                 [450,300,'f',-100],[450,100,'f',-100],[450,500,'f',-100]];
var redData = [[450,300,'f',100],[450,100,'f',100],[450,500,'f',100],
               [300,300,'m',-150],[300,100,'m',-30],[300,500,'m',-30],
               [150,250,'d',-300],[150,350,'d',-300],[150,100,'d',-200],[150,500,'d',-200],
               [40,300,'gk',0]];

function setup(){
    createCanvas(900,600);
   // frameRate(70);
    var blue = color(0,0,255);
    var red = color(255,0,0);
    team[0] = new Team(blueData,0,90,blue);
    team[1] = new Team(redData,450,80,red);
    team[0].opps = team[1];
    team[1].opps = team[0];
    ball = new Ball();
}

function draw(){
    background(0,255,0);
    team[0].draw();
    team[1].draw();
    ball.show();
    ball.update();
    rectMode(CENTER);
    fill(240);
    rect(0,300,40,100);
    rect(900,300,40,100);
}

function error(rating,max){
    var c = 0.1*pow(1.023292992,rating);
    var noiseAdded = false;
    var noiseValue = 0;
    if(random() > c)
        noiseValue = random(-max,max);
    return noiseValue;
}

function Ball(){
    this.pos = createVector(450,300);
    this.vel = createVector();
    
    this.update = function(){
        this.pos.add(this.vel);
    }
    
    this.show = function(){
        noStroke();
        fill(0);
        ellipse(this.pos.x,this.pos.y,10);
    }
    
    this.goal = function(goal){
        if(goal < 450){
            if(this.pos.y < 350 && this.pos.y > 250 && this.pos.x<goal){
                return true;
            }
            else 
                return false;
        }
        else if(goal > 450){
            if(this.pos.y < 350 && this.pos.y > 250 && this.pos.x>goal){
                return true;
            }
            else 
                return false;
        }
    }
    
    this.goalKick = function(goal){
        if(goal < 450){
            if(this.pos.y < 600 && this.pos.y > 0 && this.pos.x<goal){
                return true;
            }
            else 
                return false;
        }
        else if(goal > 450){
            if(this.pos.y < 600 && this.pos.y > 0 && this.pos.x>goal){
                return true;
            }
            else 
                return false;
        }
    }
    
    this.out = function(){
        if(this.pos.y > 600 || this.pos.y < 0 && this.pos.x>0 && this.pos.x<900){
            return this.pos;
        }
        else
            return false;
    }
}

function Bot(x,y,pos,attackPos){
    this.homePos = createVector(x,y);
    this.pos = createVector();
    this.pos = this.homePos.copy();
    this.vel = createVector();
    this.attackPosx = attackPos;
    this.position = pos;
    this.haveBall = false;
    this.kicked = false;
    this.marking = false;
    this.range = 20;
    this.safeRange = 50;
    this.speed = 0.9;
    this.state = 'wait';
    
    this.update = function(){
        this.pos.add(this.vel);
    }
    
    this.show = function(color){
        noStroke();
        fill(color);
        ellipse(this.pos.x,this.pos.y,20);
    }
    
    this.wait = function(){
        this.pos = this.pos;
        this.vel.setMag(0);
    }
    
    this.seekPos = function(target){
        var d = p5.Vector.dist(target,this.pos);
        if(d < this.range)
            this.wait();
        else
            this.move(target,this.speed);
    }
    
    this.chaseBall = function(){
        if(!this.haveBall){
            this.move(ball.pos,this.speed);
        }
    }
    
    this.kick = function(target,speed){
        if(this.haveBall && !this.kicked){
            var dir = p5.Vector.sub(target,this.pos);
            dir.normalize();
            ball.vel = dir.mult(speed); 
            this.kicked = true;
        }
    }
    
    this.moveWithBall = function(target){
        if(this.haveBall){
            this.move(target,this.speed);
            var pos = this.pos.copy();
            var vel = this.vel.copy();
            vel.setMag(10);
            ball.pos = pos.add(vel);
            //console.log("moving");
        }
    }
    
    this.attackPos = function(goal,x){
        if(abs(goal-x) < 450 && this.position != 'gk'){
            var target = createVector(x+this.attackPosx,this.homePos.y);
            this.seekPos(target);
        }
        else
            this.wait();
    }
    
    this.opponentCount = function(opponents){
        var count = 0;
        for(opp of opponents){
            var d = p5.Vector.dist(this.pos,opp.pos);
            if(d < this.safeRange)
                count++;
        }
        return count;
    }
    
    this.ballInRange = function(ball){
        var d = p5.Vector.dist(ball.pos,this.pos);
        if(d < this.range){
            this.haveBall = true;
        }
        else{
            this.haveBall = false;
        }
    }
    
    this.inRange = function(pos,range){
        var d = p5.Vector.dist(pos,this.pos);
        if(d < range){
            return true;
        }
        else{
            return false;
        }
    }
    
    this.move = function(target,speed){
        var dir = p5.Vector.sub(target,this.pos);
        dir.normalize();
        this.vel = dir.mult(speed);
    }
}

function Team(data,half,rating,color){
    this.bots = [];
    this.supportSpots = [];
    this.ballIsWithUs = false;
    this.data = data;
    this.opps;
    for(var i = 0;i<this.data.length;i++){
        this.bots[i] = new Bot(this.data[i][0],this.data[i][1],this.data[i][2],this.data[i][3]);
    }
    for(var i = 0;i < 6;i++){
        for(var j = 0;j < 11;j++){
            this.supportSpots[i*11 + j] = createVector(half+(i+1)*50,(j+1)*50);
        }
    }
    if(half == 0){
        this.goal = 20;
        this.state = 'kickOffB';
    }
    else{
        this.goal = 880;
        this.state = 'kickOffW';
    }
    this.rating = rating;
    this.target;
    this.score = 0;
    this.closestPlayer;
    this.controllingPlayer;
    this.firstSupport;
    this.secondSupport;
    this.receiver;
    this.firstSupportSpot;
    this.secondSupportSpot;
    
    this.draw = function(){
        for(bot of this.bots){
            bot.show(color);
            bot.update();
        }
        this.gameStates();
        this.ballWithUs();
        this.inControl(this.opps);
        this.ballCheck();
    }
    
    this.gameStates = function(){
        if(this.state == 'defending'){
            this.controllingPlayer = null;
            this.receiver = null;
            this.closestPlayer = this.closestToPos(ball.pos);
            for(bot of this.bots){
                if(bot == this.closestPlayer)
                    bot.chaseBall();
                else if(!bot.marking){
                    bot.seekPos(bot.homePos);
                }
            }
            this.mark(this.opps.bots);
        }
        if(this.state == 'attacking'){
            this.calcSupportSpot(this.opps.bots);
            this.closestPlayer = null;
            if(!this.controllingPlayer.kicked){
            if(this.canShoot(this.opps.bots,this.controllingPlayer.pos,shootSpeed)){
                this.target.y += error(this.rating,20) 
                this.controllingPlayer.kick(this.target,shootSpeed);
                this.receiver = null;
            }
            
            else if(this.firstSupport.inRange(this.firstSupportSpot,this.firstSupport.range)){
                this.controllingPlayer.kick(this.firstSupport.pos,passSpeed);
                this.receiver = this.firstSupport;
            }
            
            else if(this.secondSupport.inRange(this.secondSupportSpot,this.secondSupport.range)){
                this.controllingPlayer.kick(this.secondSupport.pos,passSpeed);
                this.receiver = this.secondSupport;
            }
            
            else if(this.controllingPlayer.opponentCount(this.opps.bots) == 0){
                this.controllingPlayer.moveWithBall(createVector(this.goal,300));
                this.receiver = null;
            }
            
            else{
                if(this.findPass() != null){
                    this.controllingPlayer.kick(p5.Vector.add(this.findPass().pos,createVector(error(this.rating,10),error(this.rating,10))),passSpeed);
                    this.receiver = this.findPass();
                }
                else{
                    this.controllingPlayer.moveWithBall(createVector(this.goal,300));
                    this.receiver = null;
                }
            }
            }
            for(bot of this.bots){
                bot.marking = false;
                if(bot == this.controllingPlayer)continue;
                if(bot == this.receiver){
                    if(abs(this.goal-bot.pos.x)<300||abs(this.goal-bot.pos.x)>abs(error(this.rating,900))){
                        this.receivePass(this.receiver,ball.pos,ball.vel);
                        bot.chaseBall();
                    }
                    else
                        this.receivePass(this.receiver,ball.pos,ball.vel);
                }
                else if(bot == this.firstSupport){
                    this.firstSupport.seekPos(this.firstSupportSpot);
                }
                else if(bot == this.secondSupport){
                    this.secondSupport.seekPos(this.secondSupportSpot);
                }
                else
                    bot.attackPos(this.goal,ball.pos.x);
                bot.kicked = false;
            }
        }
        if(this.state == 'kickOffW'){
            for(bot of this.bots){
                if(bot.position == 'f' && this.goal<450){
                    bot.pos.set(bot.homePos.x+125,bot.homePos.y);
                }
                else if(bot.position == 'f' && this.goal>450){
                    bot.pos.set(bot.homePos.x-125,bot.homePos.y);
                }
                else
                    bot.pos = bot.homePos.copy();
                bot.vel.set(0,0);
            }
           this.state = 'defending';
        }
        if(this.state == 'kickOffB'){
            for(bot of this.bots){
                if(bot.position == 'f' && this.goal<450){
                    bot.pos.set(bot.homePos.x+25,bot.homePos.y);
                }
                else if(bot.position == 'f' && this.goal>450){
                    bot.pos.set(bot.homePos.x-25,bot.homePos.y);
                }
                else
                    bot.pos = bot.homePos.copy();
                bot.vel.set(0,0);
            }
            this.state = 'defending';
        }
        if(this.state == 'throwIn'){
            this.closestPlayer = this.closestToPos(ball.pos);
            this.closestPlayer.chaseBall();
        }
        
        if(this.state == 'goalKick'){
            for(bot of this.bots){
                if(bot.position == 'gk'){
                    bot.pos = bot.homePos.copy();
                    bot.vel.set(0,0);
                }
            }
            this.state = 'defending';
        }
    }
    
    this.ballCheck = function(){
        if(ball.goal(this.goal)){
            this.state = 'kickOffW';
            this.opps.state = 'kickOffB';
            this.score++;
            ball.pos.set(450,300);
            ball.vel.set(0,0);
            console.log('stuck');
            if(this.goal < 450)
                console.log('BLUE : '+this.score,'RED : '+this.opps.score);
            else
                console.log('BLUE : '+this.opps.score,'RED : '+this.score);
        }
        else if(ball.out() != false && this.state == 'defending'){
            this.state = 'throwIn';
            ball.pos = ball.out().copy();
            ball.vel.set(0,0);
        }
        else if(ball.goalKick(this.goal)){
            this.state = 'defending';
            this.opps.state = 'goalKick';
            if(this.goal < 450){
                ball.pos.set(50,300);
                ball.vel.set(0,0);
            }
            else{
                ball.pos.set(850,300);
                ball.vel.set(0,0);
            }
        }
    }
    
    this.ballWithUs = function(){
        for(bot of this.bots){
            bot.ballInRange(ball);
            if(bot.haveBall){
                this.state = 'attacking';
                this.controllingPlayer = bot;
                return true;
            }
        }
    }
    
    this.inControl = function(opps){
        if(opps.ballWithUs()){
            this.state = 'defending';
        }
    }
    
    this.calcSupportSpot = function(opps){
        var score = 0;
        var maxScore = 0;
        var nxtScore = 0;
        var firstSupportSpot;
        var secondSupportSpot;
        
        for(spot of this.supportSpots){
            score = 0;
            if(this.passIsSafe(opps,this.controllingPlayer.pos,spot,passSpeed)){
                score += 1000;
            }
            if(this.canShoot(opps,spot,shootSpeed)){
                score += 500;
            }
            var d = p5.Vector.dist(this.controllingPlayer.pos,spot);
            if(d > 50)
                score += d;
            if(score > maxScore){
                maxScore = score;
                this.firstSupportSpot = p5.Vector.add(spot,createVector(error(this.rating,50),error(this.rating,50)));
            }
            else if(score > nxtScore){
                nxtScore = score;
                this.secondSupportSpot = p5.Vector.add(spot,createVector(error(this.rating,50),error(this.rating,50)));
            }
        }
        this.firstSupport = this.closestToPos(this.firstSupportSpot);
        this.secondSupport = this.closestToPos(this.secondSupportSpot);
    }
    
    this.passIsSafe = function(opps,from,target,speed){
        var dir = p5.Vector.sub(target,from);
        for(opp of opps){
            var d = p5.Vector.dist(from,opp.pos);
            if(d > dir.mag())continue;
            oppLocalx = (opp.pos.x-from.x)*cos(dir.heading()) + (opp.pos.y-from.y)*sin(dir.heading());
            oppLocaly = (opp.pos.y-from.y)*cos(dir.heading()) - (opp.pos.x-from.x)*sin(dir.heading());
            if(oppLocalx < 0)continue;
            var timeBall = oppLocalx/speed;
            var timeOpp = (abs(oppLocaly)-20)/opp.speed;
            if(timeBall > timeOpp){
                return false;
            }
        }
        return true;
    }
    
    this.canShoot = function(opps,from,speed){
        var d = p5.Vector.dist(from,createVector(this.goal,300));
        if(d < 250){
            for(var i = 0;i < 5;i++){
                this.target = createVector(this.goal,random(250,350));
                if(this.passIsSafe(opps,from,this.target,speed)){
                    return true;
                }
            }
        }
        return false;
    }
    
    this.closestToPos = function(pos){
        var minD = Infinity;
        var closest;
        for(bot of this.bots){
            if(bot == this.controllingPlayer || bot == this.receiver)continue;
            var d = p5.Vector.dist(bot.pos,pos);
            if(d < minD){
                minD = d;
                closest = bot;
            }
        }
        return closest;
    }
    
    this.findPass = function(){
        var minD = Infinity;
        var closest;
        for(bot of this.bots){
            if(bot != this.controllingPlayer){
                var c = p5.Vector.dist(bot.pos,this.controllingPlayer.pos);
                var d = p5.Vector.dist(bot.pos,createVector(this.goal,300));
                if(d<minD && c > 60 && this.passIsSafe(this.opps.bots,this.controllingPlayer.pos,bot.pos,passSpeed)){
                    minD = d;
                    closest = bot;
                }   
            }
        }
        return closest;
    }
    
    this.receivePass = function(bot,from,dir){
        var a = tan(dir.heading());
        var c = from.y - a*from.x
        var x = -a*(a*bot.pos.x - bot.pos.y + c)/(a*a+1) + bot.pos.x;
        var y = (a*bot.pos.x - bot.pos.y + c)/(a*a+1) + bot.pos.y;
        var target = createVector(x+error(this.rating,30),y+error(this.rating,30));
        bot.seekPos(target);
    }
    
    this.mark = function(opps){
        for(opp of opps){
            if(abs(this.goal-opp.pos.x) > 600){
                var minD = Infinity;
                var closest;
                for(bot of this.bots){
                    if(bot.position != 'd')continue;
                    if(opp.inRange(bot.pos,abs(error(this.rating,70))))break;
                    var d = p5.Vector.dist(bot.pos,opp.pos);
                    if(d < minD && !bot.inRange(opp.pos,abs(error(this.rating,70)))){
                        minD = d;
                        closest = bot;
                    }
                }
                if(closest){
                closest.marking = true;
                if(this.closestPlayer != closest)
                    closest.seekPos(opp.pos);
                }
            }
        }
    }
}