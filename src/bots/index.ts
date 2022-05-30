import 'src/bots/elonmusk';
import 'src/bots/whale_alert';
import { twitter } from 'src/utils/clients';

twitter.listenToUserTweets().catch(console.error);
