$(document).ready(() => {
    const database = firebase.database();
    let playerName = '';
    let playerId = '';
    let gameId = 'game1';

    $('#joinGame').click(() => {
        playerName = $('#playerName').val().trim();
        if (!playerName) return alert('Please enter your name');
        
        playerId = database.ref().push().key;
        const playerRef = database.ref(`games/${gameId}/players/${playerId}`);
        
        playerRef.set({
            name: playerName,
            choice: '',
            ready: true
        });

        $('#playerInfo').hide();
        $('#gameRoom').show();
        
        playerRef.onDisconnect().remove();
        listenForPlayers();
    });

    function listenForPlayers() {
        database.ref(`games/${gameId}/players`).on('value', (snapshot) => {
            const players = snapshot.val() || {};
            const playerCount = Object.keys(players).length;
            
            $('#players').html('');
            Object.entries(players).forEach(([id, player]) => {
                $('#players').append(`<div>${player.name} ${player.choice ? '✅' : '⏳'}</div>`);
            });

            if (playerCount === 2) {
                $('#waitingMessage').hide();
                $('#choices').show();
            } else {
                $('#choices').hide();
                $('#waitingMessage').show();
            }
        });
    }

    $('.choice').click(function() {
        const choice = $(this).data('choice');
        database.ref(`games/${gameId}/players/${playerId}`).update({ choice });
        $('#choices').hide();
        checkGame();
    });

    function checkGame() {
        database.ref(`games/${gameId}/players`).once('value', (snapshot) => {
            const players = snapshot.val();
            const playersArray = Object.values(players);

            if (playersArray.length === 2 && playersArray.every(p => p.choice)) {
                const result = determineWinner(playersArray[0], playersArray[1]);
                $('#result').html(result);
                
                setTimeout(() => {
                    Object.keys(players).forEach(pid => {
                        database.ref(`games/${gameId}/players/${pid}/choice`).set('');
                    });
                    $('#result').empty();
                    $('#choices').show();
                }, 3000);
            }
        });
    }

    function determineWinner(p1, p2) {
        const rules = {
            rock: { scissors: true, paper: false },
            paper: { rock: true, scissors: false },
            scissors: { paper: true, rock: false }
        };

        if (p1.choice === p2.choice) return "It's a tie! 🤝";
        return rules[p1.choice][p2.choice] ? 
            `${p1.name} wins! 🏆` : 
            `${p2.name} wins! 🏆`;
    }
});