import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
        home: Scaffold(
          backgroundColor:  Colors.white70,
          body: Center(
            child: Image(
              image: AssetImage('images/money.png'),
            ),
          ),
          appBar: AppBar(
            backgroundColor: Colors.red,
            title: Text('I Am Poor'),
            centerTitle: true,
          ),
        ),
    ),
  );
}