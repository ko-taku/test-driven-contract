import { expect } from 'chai';
import { ethers } from 'hardhat';

/*
  ForTesting 테스트 리스트 예시
  (아래의 테스트 외에 필요한 테스트를 구현해보시기 바랍니다.)

  - owner 관련
    - 배포시 owner 상태 변경 여부
    - setValue()를 owner만 할 수 있는지
    - withdraw()를 owner만 할 수 있는지
  
  - 함수 검증
    - setValue()를 실행 후 value를 바꾸는지
    - (getter) balances()를 실행 후 balance 값이 나오는지
    - deposit()를 실행 후 보낸 값(value)에 따라 balances를 바꾸는지
    - withdraw()를 실행 후 받을 값(amount)에 따라 balances를 바꾸는지
  
  - 이벤트 검증
    - setValue()를 실행 후 ValueChanged 이벤트가 발생하는지
    - deposit()를 실행 후 Deposited 이벤트가 발생하는지
    - withdraw()를 실행 후 Withdrawn 이벤트가 발생하는지
*/

describe('ForTesting 테스트', function () {
  let contract: any;
  let owner: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory('ForTesting');
    contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
  });

  describe('테스트 단위별로 나눌 수 있습니다.', function () {
    it('테스트 개체별로 나눌 수 있습니다.', function () {
      expect(true).to.be.true;
    });
  });

  describe('owner 관련 테스트', function () {
    it('배포시 onwer 상태 변경 여부', async function () {
      const deployOwner = await contract.owner();
      expect(deployOwner).to.equal(owner.address);
    });

    it('owner만 setValue 가능한지', async function () {
      // owner만 setValue를 실행할 수 있는지 확인
      await expect(contract.connect(owner).setValue(42))
        .to.not.be.reverted; // owner가 실행할 때는 revert되지 않아야 함

      // 다른 계정은 setValue를 실행할 수 없어야 함
      await expect(contract.connect(otherAccount).setValue(42))
        .to.be.revertedWith("Only owner can call this function");
    });

    it('Withdraw를 owner만 할 수 있는지', async function () {

      const depositValue = ethers.parseUnits("0.0001", "ether");
      // owner가 deposit한 후
      await contract.connect(owner).deposit({ value: depositValue });

      // owner만 withdraw 실행할 수 있어야 함
      await expect(contract.connect(owner).withdraw(depositValue))
        .to.not.be.reverted; // owner가 실행할 때는 revert되지 않아야 함

      // 다른 계정은 withdraw를 실행할 수 없어야 함
      await expect(contract.connect(otherAccount).withdraw(depositValue))
        .to.be.revertedWith("Only owner can call this function"); // 실패해야 함

    });
  });

  describe('함수 검증', function () {
    it('setvalue 실행 수 값이 바뀌는지', async function () {
      const value = 100;
      await contract.connect(owner).setValue(value);
      const updateValue = await contract.value();

      expect(updateValue).to.be.equal(value);

    });
    it('(getter) balances()를 실행 후 balance 값이 나오는지', async function () {

      const preBalances = await contract.balances(owner.address);
      expect(preBalances).to.not.be.undefined;

    });
    it('deposit()를 실행 후 보낸 값(value)에 따라 balances를 바꾸는지', async function () {
      const depositValue = ethers.parseUnits("0.0001", "ether"); //BigInt 처리 주의 이 부분이 에러 많이 난다
      const preBalances = await contract.balances(owner.address);
      await contract.connect(owner).deposit({ value: depositValue });
      const afterBalances = await contract.balances(owner.address);
      expect(afterBalances).to.equal(preBalances + depositValue);
    });
    it('withdraw()를 실행 후 받을 값(amount)에 따라 balances를 바꾸는지', async function () {
      const withdrawValue = ethers.parseUnits("0.0001", "ether");
      const depositValue = ethers.parseUnits("0.1", "ether");
      await contract.connect(owner).deposit({ value: depositValue });
      const preBalances = await contract.balances(owner.address);
      await contract.connect(owner).withdraw(withdrawValue);
      const afterBalances = await contract.balances(owner.address);
      expect(afterBalances).to.equal(preBalances - withdrawValue);
    });

  });

  describe('이벤트 검증', function () {
    it('setValue()를 실행 후 ValueChanged 이벤트가 발생하는지', async function () {
      await expect(contract.connect(owner).setValue(42)).to.emit(contract, "ValueChanged");
      await expect(contract.connect(otherAccount).setValue(42)).to.be.revertedWith("Only owner can call this function");
    });
    it('deposit()를 실행 후 Deposited 이벤트가 발생하는지', async function () {
      const depositValue = ethers.parseUnits("0.1", "ether");
      const zeroDepositValue = ethers.parseUnits("0", "ether");
      await expect(contract.connect(owner).deposit({ value: depositValue })).to.emit(contract, "Deposited");
      await expect(contract.connect(owner).deposit({ value: zeroDepositValue })).to.revertedWith("Must send Coins");

    });
    it('withdraw()를 실행 후 Withdrawn 이벤트가 발생하는지', async function () {
      const depositValue = ethers.parseUnits("0.1", "ether");
      const withdrawValue = ethers.parseUnits("0.0001", "ether");
      const toMuchWithdrawValue = ethers.parseUnits("0.2", "ether");
      await contract.connect(owner).deposit({ value: depositValue });

      await expect(contract.connect(owner).withdraw(withdrawValue)).to.emit(contract, "Withdrawn");
      await expect(contract.connect(owner).withdraw(toMuchWithdrawValue)).to.revertedWith("Insufficient balance");

    });

  });

});
