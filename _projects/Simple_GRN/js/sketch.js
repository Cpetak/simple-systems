let nodes = [];
let links = [];
let carriers = [];

const radius = 10;
const layer_space = 100;
const num_nodes = 30;
const num_edges = 100;
const left_offset = 30; // left side margin
const right_offset = 100; // left side margin

let num_layers = 0;

let static; // static background images

// UTILITY FUNCTIONS ########################################

function mousePressed() {
  for (let node of nodes) {
    // check if nodes are selected
    if (dist(node.pos.x, node.pos.y, mouseX, mouseY) < node.radius / 2) {
      node.propagate();
    }
  }
}

function make_nodes() {
  nodes = [];
  for (let i = 0; i < width - right_offset; i += layer_space) {
    let num_nodes = i / layer_space + 1;
    let spacing = height / (num_nodes + 1);
    for (let j = spacing; j <= height - spacing; j += spacing) {
      let pos = createVector(i + left_offset, j);
      nodes.push(new Node(pos, num_nodes));
      num_layers = num_nodes;
    }
  }
}

function wire_nodes() {
  // connect locations  #################
  for (let i = 0; i < num_edges; i++) {
    let source = random(nodes);
    let downstream_nodes = nodes.filter(
      x => x != source && x.layer > source.layer
    );
    if (downstream_nodes.length > 0) {
      let destin = random(downstream_nodes);
      links.push(new Link(source, destin));
    }
  }

  let no_incoming = nodes.filter(x => x.in.length == 0 && x.layer > 1);
  for (let to of no_incoming) {
    from = random(nodes.filter(x => x.layer < to.layer));
    links.push(new Link(from, to));
  }

  let no_outgoing = nodes.filter(
    x => x.out.length == 0 && x.layer < num_layers
  );
  for (let from of no_outgoing) {
    to = random(nodes.filter(x => from.layer < x.layer));
    links.push(new Link(from, to));
  }
  // add one incoming edge to those that have none
}

function draw_world() {
  // prepare background #############
  static.background(50);

  for (let link of links) {
    link.draw(static);
  }
  for (let node of nodes) {
    node.draw(static);
  }
}

function reset() {
  make_nodes();
  wire_nodes();
  draw_world();
}

// MAIN LOOP ########################################

function setup() {
  createCanvas(800, 600);
  static = createGraphics(width, height);
  static.clear();
  frameRate(30);
  reset(); // needs to be after UI and the above color definitions
}

function mouse_interaction() {
  for (let node of nodes) {
    // check if nodes are selected
    if (dist(node.pos.x, node.pos.y, mouseX, mouseY) < node.radius / 2) {
      node.selected = true;
    } else {
      node.selected = false;
    }
  }
}

function draw() {
  //carriers.filter(x => x.sick == false).length > 0)
  image(static, 0, 0);
  //background(50);

  mouse_interaction();

  for (let node of nodes) {
    node.update();
  }

  for (let node of nodes) {
    node.show();
  }
  for (let link of links) {
    for (let signal of link.signals) {
      signal.update();
      signal.show();
    }
  }
}

// CLASSES ########################################

class Signal {
  constructor(link) {
    this.progress = 0;
    this.speed = 4;
    this.link = link;
    this.length = p5.Vector.dist(this.link.from.pos, this.link.to.pos);
  }

  show() {
    fill("yellow");
    noStroke();
    let curr_loc = p5.Vector.lerp(
      this.link.from.pos,
      this.link.to.pos,
      this.progress / this.length
    );
    ellipse(curr_loc.x, curr_loc.y, 5);
    //stroke(255, 90);
    //noFill();
    //ellipse(this.link.from.pos.x, this.link.from.pos.y, this.progress * 2);
  }

  update() {
    this.progress += this.speed;
    if (this.progress >= this.length) {
      // destination reached
      this.link.to.propagate();
      this.link.signals = this.link.signals.filter(x => x != this);
    }
  }
}

class Node {
  constructor(pos, layer) {
    this.in = [];
    this.out = [];
    this.members = [];
    this.pos = pos;
    this.selected = false;
    this.layer = layer;
    this.radius = 10;
  }

  draw(cnvs) {
    cnvs.fill("white");
    cnvs.ellipse(this.pos.x, this.pos.y, this.radius);
    if (this.out.length == 0) {
      this.name =
        Math.random()
          .toString(36)
          .substring(2, 4) +
        Math.random()
          .toString(36)
          .substring(2, 4);
    }
  }

  propagate() {
    if (this.out.length != 0) {
      for (let link of this.out) {
        link.signals.push(new Signal(link));
      }
    } else {
      this.radius += 1;
    }
  }

  show() {
    if (this.selected) {
      for (let edge of this.out) {
        edge.show();
      }
    }
    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, this.radius);

    if (this.name != undefined) {
      textSize(14);
      text(this.name, this.pos.x + this.radius / 2 + 5, this.pos.y);
    }
  }

  update() {
    if (this.radius > radius) {
      this.radius -= 0.3;
    }
  }
}

class Link {
  constructor(source, destin) {
    this.from = source;
    this.to = destin;
    this.len = p5.Vector.dist(this.from.pos, this.to.pos); // assume nodes are static
    source.out.push(this);
    destin.in.push(this);
    this.signals = [];
  }

  draw(cnvs) {
    cnvs.stroke(255, 50);
    cnvs.line(this.from.pos.x, this.from.pos.y, this.to.pos.x, this.to.pos.y);
  }

  show() {
    stroke("red");
    line(this.from.pos.x, this.from.pos.y, this.to.pos.x, this.to.pos.y);
  }

  update() {}
}
