var fs = require('fs');
var ssh2 = require('ssh2');
var chalk = require('chalk');

var cmd;
var out;
var don;

cmd = '';
out = '';
don = true;


new ssh2.Server({
  hostKeys: [fs.readFileSync('lol')]
}, function(client) {
  console.log(chalk.green('\t> Client connected!'));

  client.on('authentication', function(ctx) {
      username = ctx.username;
    if (ctx.method === 'password')
    {
      console.log(chalk.green(`\t> Client data | ${chalk.blue(ctx.username)} & "${chalk.blue(ctx.password)}"`));
      ctx.accept();
    } else {
      ctx.reject();
    }
  }).on('ready', function() {
    console.log(chalk.green('\t> Client authenticated!'));

    client.on('session', function(accept, reject) {
      var session = accept();
      client.on('pty', (accept, reject, info) => {
        console.log(info);
        return accept();
      });
      session.once('shell', function(accept, reject, info) {
        var stream = accept();

        out += fs.readFileSync('./welcomeMessage.txt').toString();
        out += '\r\n'.repeat(3);

        done(stream);

        stream.on('data', function(data) {
          don == true;
          if (data[0] == 13) {
            console.log(chalk.blue(cmd));
            var args = cmd.replace("\n","").split(" ");
            switch(args[0]) {
                case "uptime":
                    out += `$ ${args.join(' ')}\r\n`;
                    out += '0m\r\n';
                    break;
                case "echo":
                    args.shift();
                    out += `$ ${cmd}\r\n`;
                    out += args.join(' ') + '\r\n';
                    break;
                case "whoami":
                  out += `$ ${args.join(' ')}\r\n`;
                  out += username + '\r\n'
                    break;
                case "exit":
                    stream.exit(0);
                    stream.end();
                    stream = undefined;
                    out = '';
                    break;
                case "stop":
                  process.exit();
                  break;
                case "clear":
                  out = '';
                  out += `$ ${args.join(' ')}\r\n`;
                  break;
                default:
                    don = false;
                    out += `$ ${args.join(' ')}\r\n`;
                    out += args[0] + ": No such command!\r\n";
                    console.log(chalk.red(`^ Command not found!`));
                    break;
            }

            cmd = "";

            done(stream);

            return;
          }
          else if (data[0] == 8) {
            cmd = cmd.slice(0, -1);
            done(stream);
            // stream.write(`$ ${cmd}\r\n`);
            return;
          } else {
            cmd += data.toString();
            done(stream);
            // stream.write(`$ ${cmd}\r\n`);
          }
            
        });
      });
    });
  }).on('end', function() {
    out = '';
    console.log(chalk.red('\t> Client disconnected'));
  }).on('error', function() {
    console.log(chalk.red('\t> Client error'));
  });
}).listen(3012, '0.0.0.0', function() {
  console.log(chalk.green('\t> Listening on port ' + this.address().port));
});

function done(stream) {
  if (!stream) return;


  stream.write(String('\r\n').repeat(100));
  stream.write(`${out}`);
  stream.write(`$ ${cmd}\r\n`);
}