<?php

namespace SilverStripe\CMS\Tests\Forms;

use PHPUnit\Framework\Attributes\DataProvider;
use SilverStripe\CMS\Controllers\CMSMain;
use SilverStripe\CMS\Forms\CMSMainAddForm;
use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\CMS\Model\VirtualPage;
use SilverStripe\Dev\FunctionalTest;
use SilverStripe\Security\Member;

class CMSMainAddFormTest extends FunctionalTest
{
    protected static $fixture_file = 'CMSMainAddFormTest.yml';

    protected static $required_extensions = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->logInWithPermission('ADMIN');
    }

    public static function provideRecordTypeSelection(): array
    {
        return [
            'default Page class' => [
                'recordType' => null,
                'expectedClass' => 'Page',
            ],
            'VirtualPage subclass' => [
                'recordType' => VirtualPage::class,
                'expectedClass' => 'VirtualPage',
            ],
            'invalid class defaults to Page' => [
                'recordType' => 'InvalidClass',
                'expectedClass' => 'Page',
            ],
        ];
    }

    #[DataProvider('provideRecordTypeSelection')]
    public function testRecordTypeSelection(?string $recordType, string $expectedClass): void
    {
        $url = 'admin/pages/add';
        if ($recordType !== null) {
            $url .= '?RecordType=' . urlencode($recordType);
        }
        $response = $this->get($url);
        $this->assertEquals(200, $response->getStatusCode());
        $html = $response->getBody();
        $this->assertStringContainsString('Form_AddForm', $html);
        $this->assertStringContainsString('name="RecordType"', $html);
        $this->assertStringContainsString($expectedClass, $html);
        // Verify the radio button for the expected class is checked
        $this->assertMatchesRegularExpression(
            '/<input[^>]*name="RecordType"[^>]*value="[^"]*' . preg_quote($expectedClass, '/') . '[^"]*"[^>]*checked/i',
            $html
        );
    }

    public function testRecordTypeWithParentID(): void
    {
        try {
            $page = $this->objFromFixture(SiteTree::class, 'Page1');
            $response = $this->get(
                'admin/pages/add?RecordType=' . urlencode(VirtualPage::class) . '&ParentID=' . $page->ID
            );
            $this->assertEquals(200, $response->getStatusCode());
            $html = $response->getBody();
            $this->assertStringContainsString('Form_AddForm', $html);
            $this->assertStringContainsString('VirtualPage', $html);
            $this->assertMatchesRegularExpression(
                '/<input[^>]*name="RecordType"[^>]*value="[^"]*VirtualPage[^"]*"[^>]*checked/i',
                $html
            );
            $this->assertMatchesRegularExpression(
                '/<input[^>]*name="ParentModeField"[^>]*value="child"[^>]*checked/i',
                $html
            );
            $this->assertStringContainsString((string)$page->ID, $html);
        } finally {
            // This prevents bleed over into other tests. Sending a request with ParentID in the querystring
            // seems to set a persistent state somewhere that causes other tests to fail where expected
            // urls end up with ?ParentID=1 appended to them
            $this->get('admin/pages/add');
        }
    }
}
