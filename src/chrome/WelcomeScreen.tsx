/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {
  styled,
  FlexColumn,
  FlexRow,
  Text,
  Glyph,
  colors,
  brandColors,
} from 'flipper';
import isProduction from '../utils/isProduction';
import {shell, remote} from 'electron';
import React, {PureComponent} from 'react';

const Container = styled(FlexColumn)({
  height: '100%',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.light02,
});

const Welcome = styled(FlexColumn)(({isMounted}) => ({
  width: 460,
  background: colors.white,
  borderRadius: 10,
  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
  overflow: 'hidden',
  opacity: isMounted ? 1 : 0,
  transform: `translateY(${isMounted ? 0 : 20}px)`,
  transition: '0.6s all ease-out',
}));

const Title = styled(Text)({
  fontSize: 24,
  fontWeight: 300,
  textAlign: 'center',
  color: colors.light50,
  marginBottom: 16,
});

const Version = styled(Text)({
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 300,
  color: colors.light30,
  marginBottom: 60,
});

const Item = styled(FlexRow)({
  padding: 10,
  cursor: 'pointer',
  alignItems: 'center',
  borderTop: `1px solid ${colors.light10}`,
  '&:hover, &:focus, &:active': {
    backgroundColor: colors.light02,
    textDecoration: 'none',
  },
});

const ItemTitle = styled(Text)({
  color: colors.light50,
  fontSize: 15,
});

const ItemSubTitle = styled(Text)({
  color: colors.light30,
  fontSize: 11,
  marginTop: 2,
});

const Icon = styled(Glyph)({
  marginRight: 11,
  marginLeft: 6,
});

const Logo = styled('img')({
  width: 128,
  height: 128,
  alignSelf: 'center',
  marginTop: 50,
  marginBottom: 20,
});

type Props = {};
type State = {
  isMounted: boolean;
};

export default class WelcomeScreen extends PureComponent<Props, State> {
  state = {
    isMounted: false,
  };

  timer: NodeJS.Timeout | null | undefined;

  componentDidMount() {
    // waiting sometime before showing the welcome screen to allow Flipper to
    // connect to devices, if there are any
    this.timer = setTimeout(
      () =>
        this.setState({
          isMounted: true,
        }),
      2000,
    );
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  render() {
    return (
      <Container>
        <Welcome isMounted={this.state.isMounted}>
          <Logo src="./icon.png" />
          <Title>Welcome to Flipper</Title>
          <Version>
            {isProduction()
              ? `Version ${remote.app.getVersion()}`
              : 'Development Mode'}
          </Version>
          <Item
            onClick={() =>
              shell.openExternal(
                'https://fbflipper.com/docs/getting-started.html',
              )
            }>
            <Icon size={20} name="rocket" color={brandColors.Flipper} />
            <FlexColumn>
              <ItemTitle>Using Flipper</ItemTitle>
              <ItemSubTitle>
                Learn how Flipper can help you debug your App
              </ItemSubTitle>
            </FlexColumn>
          </Item>
          <Item
            onClick={() =>
              shell.openExternal(
                'https://fbflipper.com/docs/tutorial/intro.html',
              )
            }>
            <Icon size={20} name="magic-wand" color={brandColors.Flipper} />
            <FlexColumn>
              <ItemTitle>Create your own plugin</ItemTitle>
              <ItemSubTitle>Get started with these pointers</ItemSubTitle>
            </FlexColumn>
          </Item>
          <Item
            onClick={() =>
              shell.openExternal(
                'https://fbflipper.com/docs/getting-started.html',
              )
            }>
            <Icon size={20} name="tools" color={brandColors.Flipper} />
            <FlexColumn>
              <ItemTitle>Add Flipper support to your app</ItemTitle>
              <ItemSubTitle>Get started with these pointers</ItemSubTitle>
            </FlexColumn>
          </Item>
          <Item
            onClick={() =>
              shell.openExternal('https://github.com/facebook/flipper/issues')
            }>
            <Icon size={20} name="posts" color={brandColors.Flipper} />
            <FlexColumn>
              <ItemTitle>Contributing and Feedback</ItemTitle>
              <ItemSubTitle>
                Report issues and help us improve Flipper
              </ItemSubTitle>
            </FlexColumn>
          </Item>
        </Welcome>
      </Container>
    );
  }
}
