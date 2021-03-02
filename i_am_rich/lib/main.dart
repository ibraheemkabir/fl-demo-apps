import 'package:flutter/material.dart';

//The main function is the starting point for all our flutter apps
void main() {
  runApp(
    MaterialApp(
      home: Center(
        child: Scaffold(
          backgroundColor: Colors.blueGrey,
          body: Center(
            child: Image(
              image: AssetImage('images/diamond.png'),
            ),
          ),
          appBar: AppBar(
            title: Center(
              child: Text('I Am Rich')
            ),
            backgroundColor: Colors.blueGrey[900],
          ),
        ),
      ),
    ),
  );
}
