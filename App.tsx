import React, {useState, useEffect} from 'react';
import { StyleSheet, Text,TextInput, View,Button, TouchableOpacity } from 'react-native';
// import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import RNWalletConnect from "@walletconnect/react-native";
import {  convertHexToUtf8,convertUtf8ToHex } from "@walletconnect/utils";

const TEST_ACCOUNTS = ['0x2bb0A222473862Bd68Db6f3C97ea24F9A025F26f'];

const defaultChainId = 3;

const INITIAL_STATE = {
  loading: false,
  scanner: false,
  walletConnector: null,
  uri: "",
  peerMeta: {
    description: "",
    url: "",
    icons: [],
    name: "",
    ssl: false
  },
  connected: false,
  chainId: defaultChainId,
  accounts: TEST_ACCOUNTS,
  address: TEST_ACCOUNTS[0],
  activeIndex: 0,
  requests: [],
  results: [],
  displayRequest: null,
  pendingRequest: false,
  messages: []
};

const signingMethods = [
  "eth_sendTransaction",
  "eth_signTransaction",
  "personal_sign",
  "eth_sign",
  "eth_signTypedData"
];

class App extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      hasPermission: null,
      barCodeResult: '',
      showCamera: false,
      type: Camera.Constants.Type.back,
      ...INITIAL_STATE
    }  
  }
 

  async componentDidMount(){
    const { status } = await Camera.requestPermissionsAsync();
    if(status === 'granted'){
      this.setState({hasPermission: 'granted'})
    }
  }

  initWalletConnect = async (uri) => {

    try {
      const walletConnector = new RNWalletConnect(
        {uri},{
          clientMeta: {
            // Required
            description: "WalletConnect Developer App",
            url: "https://walletconnect.org",
            icons: ["https://walletconnect.org/walletconnect-logo.png"],
            name: "WalletConnect",
            ssl: true
          },
          // push: {
          //   // Optional
          //   url: "https://push.walletconnect.org",
          //   type: "fcm",
          //   token: token,
          //   peerMeta: true,
          //   language: language
          // }
        }
      );

      if (!walletConnector.connected) {
        await walletConnector.createSession()
      }

      await this.setState({
        loading: false,
        walletConnector,
        uri: walletConnector.uri
      });      

      this.subscribeToEvents();
      console.log(this.state,'--->')
    } catch (error) {
      throw error;
    }
  };

  
  approveSession = () => {
    const { walletConnector, chainId, address } = this.state;
    if (walletConnector) {
      walletConnector.approveSession({ chainId, accounts: address });
    }
    this.setState({ walletConnector });
  };

  rejectSession = () => {
    const { walletConnector } = this.state;
    if (walletConnector) {
      walletConnector.rejectSession();
    }
    this.setState({ walletConnector });
  };

  
  killSession = () => {
    const { walletConnector } = this.state;
    if (walletConnector) {
      walletConnector.killSession();
    }
    this.resetApp();
  };

  resetApp = async () => {
    await this.setState({ ...INITIAL_STATE });
  };

  subscribeToEvents = () => {

    const {walletConnector} = this.state;

    if(walletConnector){

      walletConnector.on("session_request", (error, payload) => {
        console.log('walletConnector.on("session_request")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        const { peerMeta } = payload.params[0];
        this.setState({ peerMeta });
      });

      walletConnector.on("session_update", (error, payload) => {
        console.log('walletConnector.on("session_update")'); // tslint:disable-line

        if (error) {
          throw error;
        }
      });

      walletConnector.on("call_request", (error, payload) => {
        console.log('walletConnector.on("call_request")'); // tslint:disable-line
        const obj = {
          label: "Address", 
          value: payload.params[1],
          label2: "Message",
          value2: convertHexToUtf8(payload.params[0])
        }
        const mess = this.state.messages;
        mess.push(obj.value2)
        this.setState({message: mess})
        console.log('walletConnector.on("call_request")',payload,obj,this.state.messages,'---->'); // tslint:disable-line
        
        if (error) {
          throw error;
        }

        const requests = [...this.state.requests, payload];
        this.setState({ requests });
      });

      walletConnector.on("connect", (error, payload) => {
        console.log('walletConnector.on("connect")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        console.log(this.state,'connected----++')

        this.setState({ connected: true });
      });

      walletConnector.on("disconnect", (error, payload) => {
        console.log('walletConnector.on("disconnect")'); // tslint:disable-line

        if (error) {
          throw error;
        }

        this.resetApp();
      });

      if (walletConnector.connected) {
        console.log(walletConnector.chainId,walletConnector.accounts);
        const { chainId, accounts } = walletConnector;
        console.log(chainId,accounts)
        const address = accounts[0];
        // updateWallet(address, chainId);
        this.setState({
          connected: true,
          address,
          chainId
        });    
        this.setState({ walletConnector });
      }
    }
   
   
  };
  
  

  onBarCodeScanned = (dataObject) =>{
    this.setState({showCamera: false, barCodeResult:dataObject.data})
    this.initWalletConnect(dataObject.data);
  }

  testSignPersonalMessage = async () => {
    const { walletConnector, address } = this.state;

    if (!walletConnector) {
      return;
    }

    // test message
    const message = "Hello web wallet";

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    // personal_sign params
    const msgParams = [hexMsg, address];

    try {
      // open modal

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await walletConnector.signPersonalMessage(msgParams);
      console.log(result);
      
      // verify signature
      //const signer = recoverPersonalSignature(result, message);
      ///const verified = signer.toLowerCase() === address.toLowerCase();

      // format displayed result
      const formattedResult = {
        method: "personal_sign",
        address,
        //signer,
        //verified,
        result
      };

      // display result
      this.setState({
        walletConnector,
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ walletConnector, pendingRequest: false, result: null });
    }
  };

  render(){
    const {
      hasPermission,
      showCamera,
      type,
      peerMeta,
      connected,
      messages
    } = this.state;
    return (
      <React.Fragment>
        { hasPermission === null 
          ?
            <View />
          : hasPermission === false ?
            <Text>No access to camera</Text>
          : 
          <>
            <View style={styles.header}>
              <View>
              {
                connected ? <Text>connected to `{peerMeta.name}` </Text> : <Text>Disconnected</Text>
              }
              </View>
              <View>
              {
                connected && 
                  <TouchableOpacity onPress={this.killSession}>
                    <View>
                      <Text>Disconnect</Text>
                    </View>
                  </TouchableOpacity>
              }
              </View>
            </View>
            <View style={styles.container}>
            {
              showCamera ?
              <>
                <Camera
                  onBarCodeScanned={(dataObject) => this.onBarCodeScanned(dataObject)}
                  style={styles.cameraView}
                  type={type}
                />
                <View style={styles.scanBtn}>
                  <Button
                  title="Close"
                  onPress={ () => this.setState({showCamera: false})}
                  />
                </View>
              </>
              :
              <>
                {!connected ? (
                  peerMeta && peerMeta.name ? (
                      <>
                        <View style={{display:'flex',flexDirection: 'row',justifyContent:'space-around'}}>
                          <Button
                          title="Approve"
                          onPress={ () => {this.approveSession()} }
                          />
                          <Button
                          title="Reject"
                          onPress={ () => {this.rejectSession()}}
                          />
                        </View>
                      </>
                    ) : <> 
                       <View style={{paddingBottom: '6%'}}>
                          <Text style={{fontWeight:'bold',fontSize: 25}}>Wallet</Text>
                          </View>
                            <View style={{display:'flex',flexDirection: 'row',justifyContent:'space-around'}}>
                            <Button
                            title="Scan QrCode"
                            onPress={ () => this.setState({showCamera: true}) }
                            />
                            <Text style={{padding:'2%'}}>OR</Text>
                            <TextInput
                              style={{ height: 40, borderColor: 'gray',padding: '3%', borderWidth: 1,width: '30%' }}
                              onChangeText={text => this.onBarCodeScanned({data:text})}
                              placeholder={'Paste Uri'}
                            />
                        </View>
                    </>
                    
                  ) : 
                    <> 
                      <View style={{display:'flex',flexDirection: 'row',justifyContent:'space-around'}}>
                        <Button
                        title="Send Custom Message"
                        onPress={ () => {this.testSignPersonalMessage()} }
                        />
                      </View>
                      <View style={{padding: '5%'}}>
                        {
                          messages.length !== 0 &&
                          messages.map(element=>
                            <Text style={{padding: '5%'}}>{element}</Text>
                          )
                        }
                      </View>
                    </>
                  }
                </>
              }
            </View>
          </>
        }
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraView: {
    width: 250,
    height: 250,
    borderRadius: 30,
  },
  scanBtn: {
    paddingTop: '5%',
    width: '50%'
  },
  header: {
    marginTop: '8%',
    padding: '3%',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row'
  }
});

export default App;
