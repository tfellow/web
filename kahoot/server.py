import json
import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

LAN_IP = get_lan_ip()
ROOM_STATE = {
    '_lanIp': LAN_IP,
    '_port': 8765
}

class MyKahootHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/room'):
            ROOM_STATE['_lanIp'] = get_lan_ip()
            ROOM_STATE['_port'] = 8765
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(ROOM_STATE, ensure_ascii=False).encode('utf-8'))
            return
        return super().do_GET()

    def do_POST(self):
        global ROOM_STATE
        if self.path.startswith('/api/room'):
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
            try:
                incoming = json.loads(raw)
                mode = incoming.get('_mode', 'full')
                if mode == 'host_reset':
                    ROOM_STATE = incoming.get('room', {})
                elif mode == 'player_join':
                    player = incoming.get('player', {})
                    em = (player.get('email') or '').lower().strip()
                    if em:
                        if 'players' not in ROOM_STATE or not isinstance(ROOM_STATE.get('players'), dict):
                            ROOM_STATE['players'] = {}
                        if em not in ROOM_STATE['players']:
                            ROOM_STATE['players'][em] = player
                elif mode == 'player_answer':
                    em = (incoming.get('email') or '').lower().strip()
                    q_idx = str(incoming.get('qIndex', 0))
                    ans_obj = incoming.get('answerObj', {})
                    score_val = incoming.get('score', 0)
                    streak_val = incoming.get('streak', 0)
                    max_streak_val = incoming.get('maxStreak', 0)
                    if em and 'players' in ROOM_STATE and em in ROOM_STATE['players']:
                        p = ROOM_STATE['players'][em]
                        if 'answers' not in p or not isinstance(p['answers'], dict):
                            p['answers'] = {}
                        p['answers'][q_idx] = ans_obj
                        p['score'] = score_val
                        p['streak'] = streak_val
                        p['maxStreak'] = max_streak_val
                else:
                    existing_players = ROOM_STATE.get('players', {}) if isinstance(ROOM_STATE, dict) else {}
                    new_room = incoming.get('room', incoming)
                    new_players = new_room.get('players', {})
                    for k, v in existing_players.items():
                        if k not in new_players and new_room.get('pin') == ROOM_STATE.get('pin'):
                            new_players[k] = v
                    new_room['players'] = new_players
                    ROOM_STATE = new_room

                ROOM_STATE['_lanIp'] = get_lan_ip()
                ROOM_STATE['_port'] = 8765
            except Exception:
                pass
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(ROOM_STATE, ensure_ascii=False).encode('utf-8'))
            return

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = ThreadingHTTPServer(('0.0.0.0', 8765), MyKahootHandler)
    print(f'MY Kahoot Server running on http://{LAN_IP}:8765')
    server.serve_forever()
