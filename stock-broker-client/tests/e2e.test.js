import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCurrency(text) {
    return parseFloat(text.replace(/[^0-9.]/g, ''));
}

(async function runE2ETest() {
    const geckodriverPath = path.join(__dirname, '../geckodriver');
    const service = new firefox.ServiceBuilder(geckodriverPath);

    const options = new firefox.Options();
    options.setBinary('/usr/bin/firefox');
    let driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .setFirefoxService(service)
        .build();
    
    try {
        console.log('Тест запущен. Открываем страницу входа...');
        await driver.get('http://localhost:5174/'); 

        console.log('Ожидаем загрузки страницы и начальных данных...');
        await driver.wait(until.elementLocated(By.xpath("//input[@id='username']")), 10000);
        await driver.sleep(2000);

        console.log('Входим в систему под именем "Peter Lynch"...');
        await driver.findElement(By.xpath("//input[@id='username']")).sendKeys('Peter Lynch');
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Торговый терминал')]")), 10000);
        console.log('Вход выполнен успешно.');

        console.log('\Проверка покупки 2 акций MSFT...');
        const balanceLocator = By.xpath("//span[text()='Баланс:']/following-sibling::span");        
        await driver.wait(until.elementLocated(balanceLocator), 10000);
        console.log('Ожидаем поступления цен по WebSocket...');
        await driver.wait(async () => {
            const priceText = await driver.findElement(By.xpath("//tr[td[text()='MSFT']]//td[2]")).getText();
            return priceText.trim() !== '$0.00';
        }, 10000);
        console.log('Цены успешно обновлены.');

        const initialBalanceText = await driver.findElement(balanceLocator).getText();
        const initialBalance = parseCurrency(initialBalanceText);
        const priceText = await driver.findElement(By.xpath("//tr[td[text()='MSFT']]//td[2]")).getText();
        const price = parseCurrency(priceText);

        console.log(`Баланс до покупки: $${initialBalance}`);
        console.log(`Текущая цена MSFT: $${price}`);

        const buyButton = await driver.findElement(By.xpath("//tr[contains(td, 'MSFT')]//button[contains(., 'Купить')]"));
        await buyButton.click();
        await driver.wait(until.elementLocated(By.xpath("//div[@class='modal-content']")), 5000);

        const quantityInput = await driver.findElement(By.xpath("//input[@id='quantity']"));
        await quantityInput.clear();
        await quantityInput.sendKeys('2');

        const confirmButton = await driver.findElement(By.xpath("//button[text()='Подтвердить']"));
        await driver.executeScript("arguments[0].click();", confirmButton); 
        await driver.wait(until.alertIsPresent(), 5000);
        let alert = await driver.switchTo().alert();
        await alert.accept();
        console.log('Транзакция на покупку отправлена.');
        await driver.sleep(1000); 

        const afterBuyBalanceText = await driver.findElement(balanceLocator).getText();
        const afterBuyBalance = parseCurrency(afterBuyBalanceText);
        const expectedBalance = initialBalance - (price * 2);

        console.log(`Баланс после покупки: $${afterBuyBalance.toFixed(2)}`);
        console.log(`Ожидаемый баланс: $${expectedBalance.toFixed(2)}`);

        if (Math.abs(afterBuyBalance - expectedBalance) < 0.1) {
            console.log('Проверка баланса после покупки ПРОЙДЕНА!');
        } else {
            throw new Error('Баланс после покупки не соответствует ожидаемому');
        }

        console.log('\nЭтап 4: Проверка продажи 5 акций MSFT...');
        const portfolioTablePath = "//h2[text()='Мой портфель']/following-sibling::table";
        await driver.wait(until.elementLocated(By.xpath(`${portfolioTablePath}//tr[td[contains(., 'MSFT')]]`)), 5000);
        const initialQuantityText = await driver.findElement(By.xpath(`${portfolioTablePath}//tr[td[contains(., 'MSFT')]]//td[2]`)).getText();
        const initialQuantity = parseInt(initialQuantityText, 10);
        const MSFTPriceText = await driver.findElement(By.xpath("//h2[text()='Акции на рынке']/following-sibling::table//tr[td[contains(., 'MSFT')]]//td[2]")).getText();
        const MSFTPrice = parseCurrency(MSFTPriceText);

        console.log(`Количество акций MSFT до продажи: ${initialQuantity}`);
        console.log(`Цена акции MSFT: $${MSFTPrice}`);
        if (isNaN(initialQuantity) || initialQuantity <= 0) {
            throw new Error('Не удалось получить начальное количество акций MSFT');
        }
        const sellButton = await driver.findElement(By.xpath(`${portfolioTablePath}//tr[contains(., 'MSFT')]//button[contains(., 'Продать')]`));
        await sellButton.click();
        await driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'Продажа акции')]")), 5000);

        const sellQuantityInput = await driver.findElement(By.xpath("//input[@id='quantity']"));
        await sellQuantityInput.clear();
        await sellQuantityInput.sendKeys('5');

        const confirmSellButton = await driver.findElement(By.xpath("//button[text()='Подтвердить']"));
        await driver.executeScript("arguments[0].click();", confirmSellButton);
        await driver.wait(until.alertIsPresent(), 5000);
        let sellAlert = await driver.switchTo().alert();
        await sellAlert.accept();
        console.log('Транзакция на продажу отправлена.');
        await driver.sleep(1000);

        const afterSellBalanceText = await driver.findElement(balanceLocator).getText();
        const afterSellBalance = parseCurrency(afterSellBalanceText);
        const expectedBalanceAfterSell = afterBuyBalance + (MSFTPrice * 5);

        console.log(`Баланс после продажи: $${afterSellBalance.toFixed(2)}`);
        console.log(`Ожидаемый баланс: $${expectedBalanceAfterSell.toFixed(2)}`);

        const diff = Math.abs(afterSellBalance - expectedBalanceAfterSell);
        const tolerance = MSFTPrice;

        if (afterSellBalance > afterBuyBalance && diff < tolerance) {
            console.log('Проверка баланса после продажи ПРОЙДЕНА!');
        } else {
            throw new Error('Баланс после продажи отличается от ожидаемого');
        }

        const finalQuantityText = await driver.findElement(By.xpath(`${portfolioTablePath}//tr[td[contains(., 'MSFT')]]//td[2]`)).getText();
        const finalQuantity = parseInt(finalQuantityText, 10);
        const expectedQuantity = initialQuantity - 5;

        console.log(`Количество акций AAPL после продажи: ${finalQuantity}`);
        console.log(`Ожидаемое количество: ${expectedQuantity}`);

        if (finalQuantity === expectedQuantity) {
            console.log('Проверка количества акций после продажи ПРОЙДЕНА!');
        } else {
            throw new Error('Количество акций после продажи отличается от ожидаемого');
        }

    } catch (error) {
        console.error('Возникла ошибка во время теста: ', error);
    } finally {
        console.log('Тест завершен');
        if (driver) {
            await driver.quit();
        }
    }
})();